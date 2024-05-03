import { ipcMain, app } from 'electron';
import path from 'path';
import settings from 'electron-settings';
import { LocalIndex } from 'vectra';

const functionsDB = new LocalIndex(path.join(app.getPath('userData'), 'db', 'functions.db'));

console.log("$$$$$$$$$$$$$$$$$$$$$$$$$");

ipcMain.on('save-settings', async (event, arg) => {
  console.log('save-settings', arg);
  if(!(await functionsDB.isIndexCreated())) {
    await functionsDB.createIndex();
  }
  if(arg.name) {
    settings.set('name', arg.name);
  }
  if(arg.apiKey) {
    settings.set('apiKey', arg.apiKey);
  }
  if(arg.addFunction) {
    await functionsDB.insertItem({
      id: new Date().getTime().toString(),
      vector: [] as number[],
      metadata: {
        name: arg.addFunction.functionName,
        description: arg.addFunction.functionDefinition,
        code: arg.addFunction.code
      }
    });
    event.reply('get-settings', await getSettings());
  }
  if(arg.deleteFunction) {
    await functionsDB.deleteItem(arg.deleteFunction);
    event.reply('get-settings', await getSettings());
  }
});

ipcMain.on('get-settings', async (event, arg) => {
  console.log('get-settings ################################');
  event.reply('get-settings', await getSettings());
});

async function getSettings() {
  if(!(await functionsDB.isIndexCreated())) {
    await functionsDB.createIndex();
  }
  const name = await settings.get('name');
  const apiKey = await settings.get('apiKey');
  const functions = await functionsDB.listItems();
  return { name, apiKey, functions };
}
