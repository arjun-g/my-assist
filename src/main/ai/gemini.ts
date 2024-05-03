import {
  ChatSession,
  Content,
  type EmbedContentResponse,
  FunctionCallingMode,
  GenerativeModel,
  GoogleGenerativeAI,
  FunctionCall,
  Part,
} from '@google/generative-ai';

import settings from 'electron-settings';

import { type AIHandler } from './index';
import FUNCTIONS from '../functions';

import { AIFunction, AIMessage, AIMessageContent } from '../..';

export default class GeminiAI implements AIHandler {
  modelName: string;
  genAI: GoogleGenerativeAI | undefined;
  chat: ChatSession | undefined;

  constructor(modelName: string) {
    this.modelName = modelName;
  }

  async init(history: AIMessage[]) {
    const apikey = await settings.get(`gemini.apikey`);
    this.genAI = new GoogleGenerativeAI(apikey?.toString() || '');
    const genModel = this.genAI.getGenerativeModel({
      model: this.modelName,
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.AUTO,
        },
      },
    });
    const generationConfig = {
      temperature: 1,
      topK: 0,
      topP: 0.95,
      maxOutputTokens: 8192,
    };
    this.chat = genModel.startChat({
      generationConfig,
      tools: [
        {
          functionDeclarations: [
            ...Object.values(FUNCTIONS).map(fn => (fn as AIFunction).definition)
          ]
        }
      ],
      history: history.map(msg => ({
        role: msg.role,
        parts: msg.content
      }))
    });
  }

  async embedText(text: string): Promise<number[]> {
    const genModel = this.genAI?.getGenerativeModel({ model: "embedding-001" });
    const resp = await genModel?.embedContent(text) as EmbedContentResponse;
    console.log("RESP", JSON.stringify(resp, null, 2));
    return resp.embedding.values;
  }

  async embedFile(file: Blob): Promise<number[]> {
    const genModel = this.genAI?.getGenerativeModel({ model: "embedding-001" });
    const resp = await genModel?.embedContent("text") as EmbedContentResponse;
    console.log("RESP", JSON.stringify(resp, null, 2));
    return resp.embedding.values;
  }

  contentToAIMessage(content: Content): AIMessage {
    return {
      role: content.role,
      content: content.parts
    }
  }

  async sendMessage(text: string): Promise<AIMessage[]> {
    const result: AIMessage[] = [];
    let messageResult = await this.chat?.sendMessage(text);
    result.push({ ...this.contentToAIMessage(messageResult?.response.candidates?.[0].content as Content), timestamp: new Date().toISOString() });
    console.log("MESSAGE RESULT 1 ##################", JSON.stringify(messageResult, null, 2));
    while(messageResult?.response.functionCalls()){
      const newMessage: Part[] = [];
      const functionCalls = messageResult.response.functionCalls() as FunctionCall[];
      for(const functionCall of functionCalls){
        newMessage.push({
          functionResponse: {
            name: functionCall.name,
            response: await FUNCTIONS[functionCall.name](functionCall.args)
          }
        });
      }
      result.push({ ...this.contentToAIMessage({role: 'function', parts: newMessage}), timestamp: new Date().toISOString() });
      messageResult = await this.chat?.sendMessage(newMessage);
      console.log("MESSAGE RESULT 2 ##################", JSON.stringify(messageResult, null, 2));
      result.push({ ...this.contentToAIMessage(messageResult?.response.candidates?.[0].content as Content), timestamp: new Date().toISOString() });
    }

    return result;
  }

}
