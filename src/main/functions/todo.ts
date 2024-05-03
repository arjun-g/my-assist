import { FunctionDeclarationSchemaType } from '@google/generative-ai';
import { LocalIndex, LocalDocument } from 'vectra';
import path from 'path';
import { app } from 'electron';

import AI from '../ai';
import { randomString } from '../util';
import dayjs from 'dayjs';
import { BrowserWindow } from 'electron';

let DB: LocalIndex;

export async function initDB(dbPath: string) {
  DB = new LocalIndex(dbPath);
  const indexCreated = await DB.isIndexCreated();
  if(!indexCreated)
    await DB.createIndex();
}

export async function addToDo({ text, datetime }:{ text: string, datetime: string }) {
  const embedding = await AI.embedText(text);
  const todo = {
    id: new Date().getTime().toString(),
    vector: embedding,
    metadata: {
      text,
      datetime: dayjs(datetime).toDate(),
    }
  }
  await DB.insertItem(todo);
  return { id: todo.id, response: 'To-do item added successfully' };
}

addToDo.definition = {
  name: 'addToDo',
  description: 'Add a to-do or reminder for the user',
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
      text: {
        type: FunctionDeclarationSchemaType.STRING,
        description: 'The text of the to-do item',
      },
      dateTime: {
        type: FunctionDeclarationSchemaType.STRING,
        description:
          'The date and time of the to-do/reminder item. This shoould be in ISO Date Time format. This is optional.',
      },
    },
    required: ['text'],
  },
};

export async function getToDos() {
  const todos = await DB.listItems();
  return {
    todos: todos.map(todo => {
      return {
        id: todo.id,
        text: todo.metadata.text,
        datetime: todo.metadata.datetime?.toString(),
      }
    })
  };
}

getToDos.definition = {
  name: 'getToDos',
  description: 'Get all to-do/reminder items',
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {},
  },
};

export async function displayToDos() {
  return getToDos();
}

displayToDos.displayOnly = true;

displayToDos.definition = {
  name: 'displayToDos',
  description: 'Display todo/reminder to the user',
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {},
  },
};

export async function deleteToDo({id}:{id: string}) {
  return DB.deleteItem(id);
}

deleteToDo.definition = {
  name: 'deleteToDo',
  description: 'Delete or completes a to-do/reminder item',
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
      id: {
        type: FunctionDeclarationSchemaType.STRING,
        description: 'The ID of the to-do/reminder item to delete',
      },
    },
    required: ['id'],
  },
};

export async function searchToDos({ text }: {text: string}) {
  const embedding = await AI.embedText(text);
  const todos = await DB.queryItems(embedding, 5);
  return {
    todos: todos.map(todo => {
      return {
        id: todo.item.id,
        text: todo.item.metadata.text,
        datetime: todo.item.metadata.datetime?.toString(),
      }
    })
  };
}

searchToDos.definition = {
  name: 'searchToDos',
  parameters: {
    type: FunctionDeclarationSchemaType.OBJECT,
    properties: {
      text: {
        type: FunctionDeclarationSchemaType.STRING,
        description: 'The text to search for in the to-do/reminder items',
      },
    },
    required: ['text'],
  },
};

function scheduleRunner(){
  const chatDB = new LocalIndex(path.join(app.getPath('userData'), 'db', 'chat.db'));

  setInterval(async () => {
    console.log("Checking for reminders");
    const todos = await DB.listItems();
    const now = new Date();
    for(const todo of todos){
      console.log(todo.metadata.datetime && dayjs(todo.metadata.datetime as string).diff(now, 'second', true));
      if(todo.metadata.datetime && dayjs(todo.metadata.datetime as string).diff(now, 'second', true) < 60000 && dayjs(todo.metadata.datetime as string).diff(now, 'second', true) > 0){
        console.log("Sending reminder", dayjs(todo.metadata.datetime as string).diff(now, 'second'));
        BrowserWindow.getAllWindows()[0].webContents.send('chat-new-message', {
          id: new Date().getTime().toString(),
          role: 'local',
          content: [
            { text: `Reminder: ${todo.metadata.text}` },
          ],
          timestamp: new Date(),
        });
      }
    }
  }, 30000);
}

scheduleRunner();
