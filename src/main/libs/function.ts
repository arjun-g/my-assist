import { app } from 'electron';
import { LocalIndex } from 'vectra';
import path from 'path';

const functionsDB = new LocalIndex(path.join(app.getPath('userData'), 'db', 'functions.db'));

export async function getCustomFunctionDefinitions(){
  return (await functionsDB.listItems()).map((item) => JSON.parse(item.metadata.description as string));
}

export async function getCustomFunction(name: string){
  const code = (await functionsDB.listItems()).find((item) => JSON.parse(item.metadata.description as string).name === name)?.metadata.code;
  return eval(code as string);
}
