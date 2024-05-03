import { ipcMain, app, ipcRenderer, BrowserWindow } from 'electron';
import { LocalIndex } from 'vectra';
import settings from 'electron-settings';
import path from 'path';

import AI from './ai';
import * as ToDo from './functions/todo';
import { AIMessage, AIMessageContent } from '..';
import { randomString } from './util';

const chatDB = new LocalIndex(
  path.join(app.getPath('userData'), 'db', 'chat.db'),
);

ipcMain.on('chat-initiate', async (event, arg) => {
  if (!(await chatDB.isIndexCreated())) {
    await chatDB.createIndex();
  }

  const messages = (await chatDB.listItems<AIMessage>()).map((msg) => {
    return {
      id: msg.id,
      role: msg.metadata.role,
      content: msg.metadata.content,
      timestamp: msg.metadata.timestamp,
    };
  });
  await AI.init(messages);

  await ToDo.initDB(path.join(app.getPath('userData'), 'db', 'todo.db'));
});

ipcMain.on('chat-list', async (event, arg) => {
  const messages = (await chatDB.listItems<AIMessage>())
    .filter((msg) => {
      return (
        ['user', 'model'].includes(msg.metadata.role) &&
        !msg.metadata.content[0].functionCall
      );
    })
    .map((msg) => {
      return {
        id: msg.id,
        role: msg.metadata.role,
        content: msg.metadata.content,
        timestamp: msg.metadata.timestamp,
      };
    });
  event.reply('chat-list', messages);
});

ipcMain.on('chat-message', async (event, arg) => {
  const { message, image } = arg;

  let newMessage = {
    id: new Date().getTime().toString(),
    vector: [] as number[],
    metadata: {
      role: 'user',
      content: [{ text: message }] as AIMessageContent[],
      timestamp: new Date().toISOString(),
    },
  };
  if (image) {
    newMessage.metadata.content.push({
      inlineData: {
        data: image,
        mimeType: 'image/jpeg',
      },
    });
  }
  BrowserWindow.getAllWindows()[0].webContents.send('chat-new-message', {
    id: newMessage.id,
    role: newMessage.metadata.role,
    content: newMessage.metadata.content,
    timestamp: newMessage.metadata.timestamp,
  });
  const vector = await AI.embedText(
    JSON.stringify({ text: message, datetime: new Date().toISOString() }),
  );
  newMessage.vector = vector;
  await chatDB.insertItem(newMessage);
  const reply = await AI.sendMessage(newMessage.metadata.content);
  console.log('GOT REPLY', JSON.stringify(reply, null, 2));
  for (const msg of reply) {
    newMessage = {
      id: new Date().getTime().toString(),
      vector: [] as number[],
      metadata: {
        role: msg.role,
        content: msg.content as AIMessageContent[],
        timestamp: msg.timestamp as string,
      },
    };
    if (
      (msg.role === 'model' || msg.role === 'user') &&
      !msg.content.find((content) => content.functionCall)
    ) {
      BrowserWindow.getAllWindows()[0].webContents.send('chat-new-message', {
        id: newMessage.id,
        role: newMessage.metadata.role,
        content: newMessage.metadata.content,
        timestamp: newMessage.metadata.timestamp,
      });
    }
    const vector = await AI.embedText(
      JSON.stringify({ text: msg.content, datetime: msg.timestamp }),
    );
    newMessage.vector = vector;
    await chatDB.insertItem(newMessage);
  }
});
