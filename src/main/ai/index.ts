import { AIMessage } from "../..";
import GeminiAI from "./gemini";
import VertexGeminiAI from "./vertex";

export interface AIHandler {
  init(history: AIMessage[]): void;
  embedText(text: string): Promise<number[]>;
  embedFile(file: Blob): Promise<number[]>;
  sendMessage(text: string): Promise<AIMessage[]>;
}

// const CurrentAI = new GeminiAI('gemini-1.0-pro');
const CurrentAI = new VertexGeminiAI('gemini-1.5-pro-preview-0409');

export default CurrentAI;
