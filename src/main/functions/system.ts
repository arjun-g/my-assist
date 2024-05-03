import { FunctionDeclarationSchemaType } from "@google/generative-ai";
import { app, shell } from "electron";
import settings from "electron-settings";

import AI from "../ai";
import { LocalIndex } from "vectra";
import path from "path";

export async function sendMessage({ text }: { text: string }){
  console.log("TEXT", text);
}

sendMessage.definition = {
  name: "sendMessage",
  description: "Sends a notification to the user",
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
      text: {
        type: FunctionDeclarationSchemaType.STRING,
        description: 'Message to send to user',
      }
    },
    required: ['text'],
  }
}

export async function openBrowser({ url }: { url: string }){
  console.log("URL", url);
  shell.openExternal(url);
  return { success: true }
}

openBrowser.definition = {
  name: "openBrowser",
  description: "Opens a browser window",
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
      url: {
        type: FunctionDeclarationSchemaType.STRING,
        description: 'URL to open in browser',
      }
    },
    required: ['url'],
  }
}

export async function conversationSearch({ query }: { query: string }){
  const chatDB = new LocalIndex(path.join(app.getPath('userData'), 'db', 'chat.db'));
  const vector = await AI.embedText(query);
  const messages = await chatDB.queryItems(vector, 10);
  return JSON.stringify({ messages: messages.map((message) => message.item.metadata) });
}

conversationSearch.definition = {
  name: "conversationSearch",
  description: "Searches for a existing conversation",
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
      query: {
        type: FunctionDeclarationSchemaType.STRING,
        description: 'Search query',
      }
    },
    required: ['query'],
  }
}

export function saveAssistantName({ name }: { name: string }){
  settings.set("name", name);
  return { response: "name updated sucessfully" };
}

saveAssistantName.definition = {
  name: "saveAssistantName",
  description: "Saves the assistant's name",
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
      name: {
        type: FunctionDeclarationSchemaType.STRING,
        description: 'Name of the assistant',
      }
    },
    required: ['name'],
  }
}
