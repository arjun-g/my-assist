import {
  type FileDataPart,
  type FunctionCallPart,
  type FunctionResponsePart,
  type InlineDataPart,
  type TextPart,
  type FunctionDeclaration,
} from '@google/generative-ai';

declare interface AIFunction extends Function {
  (args: any): any;
  definition: FunctionDeclaration;
  displayOnly?: boolean;
}

declare type AIMessageContent =
  | TextPart
  | InlineDataPart
  | FunctionCallPart
  | FunctionResponsePart
  | FileDataPart;

export declare interface AIMessage {
  id?: string;
  content: AIMessageContent[];
  timestamp?: string;
  role: string;
}
