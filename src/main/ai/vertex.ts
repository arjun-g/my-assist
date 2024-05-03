import {
  ChatSession,
  Content,
  GenerativeModel,
  FunctionCall,
  VertexAI,
  Part,
  ChatSessionPreview,
  SafetySetting,
  HarmCategory,
  HarmBlockThreshold,
} from '@google-cloud/vertexai';
import aiplatform, { helpers } from '@google-cloud/aiplatform';

import settings from 'electron-settings';

import { type AIHandler } from './index';
import FUNCTIONS from '../functions';
import { getCustomFunctionDefinitions, getCustomFunction } from "../libs/function";

import { AIFunction, AIMessage, AIMessageContent } from '../..';
import { getSystemPrompt } from '../constants';

const { PredictionServiceClient } = aiplatform.v1;

export default class VertexGeminiAI implements AIHandler {
  modelName: string;
  genAI: VertexAI | undefined;
  chat: ChatSessionPreview | undefined;
  history: AIMessage[] = [];

  safetySettings: SafetySetting[] = [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_NONE,
    },
  ];

  generationConfig = {

  }

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  async init(history: AIMessage[]) {
    this.history = history;
    this.genAI = new VertexAI({
      project: 'kf-pm-product-analytics-d001',
      location: 'us-central1',
    });
    const genModel = this.genAI.preview.getGenerativeModel({
      model: this.modelName,
      safetySettings: this.safetySettings,
    });

    this.chat = genModel.startChat({
      generationConfig: this.generationConfig,
      tools: [
        {
          functionDeclarations: [
            ...Object.values(FUNCTIONS).map(
              (fn) => (fn as AIFunction).definition,
            ),
            ...(await getCustomFunctionDefinitions()),
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: await getSystemPrompt(),
          },
        ],
      },
      history: history.map((msg) => ({
        role: msg.role,
        parts: msg.content,
      })),
    });
  }

  async embedText(text: string): Promise<number[]> {
    const predictionClient = new PredictionServiceClient({
      apiEndpoint: 'us-central1-aiplatform.googleapis.com',
    });
    //@ts-ignore
    const [response] = await predictionClient.predict({
      endpoint:
        'projects/kf-pm-product-analytics-d001/locations/us-central1/publishers/google/models/text-embedding-preview-0409',
      instances: [
        //@ts-ignore
        helpers.toValue({
          content: text,
          task: 'QUESTION_ANSWERING',
        } as any),
      ],
    });
    const embeddings =
      response.predictions?.[0].structValue?.fields?.embeddings;
    const values = embeddings?.structValue?.fields?.values?.listValue?.values;
    return values.map((value: any) => value.numberValue) as number[];
  }

  async embedFile(file: Blob): Promise<number[]> {
    return [];
  }

  contentToAIMessage(content: Content): AIMessage {
    return {
      role: content.role,
      content: content.parts,
    };
  }

  async sendMessage(text: string): Promise<AIMessage[]> {
    const result: AIMessage[] = [];
    const genModel = this.genAI?.preview.getGenerativeModel({
      model: this.modelName,
      safetySettings: this.safetySettings
    });
    this.chat = genModel?.startChat({
      generationConfig: this.generationConfig,
      tools: [
        {
          functionDeclarations: [
            ...Object.values(FUNCTIONS).map(
              (fn) => (fn as AIFunction).definition,
            ),
            ...(await getCustomFunctionDefinitions()),
          ],
        },
      ],
      systemInstruction: {
        role: 'system',
        parts: [
          {
            text: await getSystemPrompt(),
          },
        ],
      },
      history: this.history.map((msg) => ({
        role: msg.role,
        parts: msg.content,
      })),
    });
    let messageResult = await this.chat?.sendMessage(text);
    if(!messageResult?.response.candidates){
      messageResult = await this.chat?.sendMessage(text);
    }
    console.log('MESSAGE RESULT 1', JSON.stringify(messageResult, null, 2));
    result.push({
      ...this.contentToAIMessage(
        messageResult?.response.candidates?.[0].content as Content,
      ),
      timestamp: new Date().toISOString(),
    });

    while (
      messageResult?.response.candidates?.[0].content.parts.find(
        (part) => !!part.functionCall,
      )
    ) {
      const newMessage: Part[] = [];
      for (
        let i = 0;
        i <
        (messageResult?.response?.candidates?.[0].content?.parts?.length ?? 0);
        i++
      ) {
        const part = messageResult?.response.candidates?.[0].content.parts[
          i
        ] as Part;
        if (part.functionCall) {
          let functionResponse: any = null;
          if(FUNCTIONS[part.functionCall.name]){
            functionResponse = await FUNCTIONS[part.functionCall.name](
              part.functionCall.args,
            );
          }
          else{
            functionResponse = await (await getCustomFunction(part.functionCall.name))(
              part.functionCall.args,
            );
          }
          console.log(
            'FUNCTION RESPONSE',
            JSON.stringify(functionResponse, null, 2),
          );
          newMessage.push({
            functionResponse: {
              name: part.functionCall.name,
              response: functionResponse,
            },
          });
          result.push({
            ...this.contentToAIMessage({ role: 'function', parts: newMessage }),
            timestamp: new Date().toISOString(),
          });
          console.log('NEW MESSAGE', JSON.stringify(newMessage, null, 2));
          messageResult = await this.chat?.sendMessage(newMessage);
          console.log(
            'MESSAGE RESULT 2',
            JSON.stringify(messageResult, null, 2),
          );
          if(!messageResult?.response.candidates){
            console.log('RETRYING MESSAGE');
            messageResult = await this.chat?.sendMessage(newMessage);
          }
          if(!messageResult?.response.candidates){
            messageResult = {
              response: {
                candidates: [
                  {
                    index: 0,
                    content: {
                      role: 'model',
                      parts: [
                        {
                          text: 'It is done 👍',
                        },
                      ],
                    },
                  },
                ],
              },
            };
          }
          console.log(
            'MESSAGE RESULT 3',
            JSON.stringify(messageResult, null, 2),
          );
        }
      }
      result.push({
        ...this.contentToAIMessage(
          messageResult?.response.candidates?.[0].content as Content,
        ),
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  }
}
