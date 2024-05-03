import { LocalIndex } from 'vectra';
import { app } from 'electron';

import { AIMessage } from '../..';
import path from 'path';

class DB {
  private db: LocalIndex;

  constructor() {
    this.db = new LocalIndex(path.join(app.getPath('userData'), 'db', 'chat.db'));
    this.db.isIndexCreated().then(indexCreated => {
      if (!indexCreated) {
        this.db.createIndex();
      }
    });
  }
}

export default new DB();
