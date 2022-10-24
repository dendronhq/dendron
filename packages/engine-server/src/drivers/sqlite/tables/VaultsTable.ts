/* eslint-disable no-empty-function */

import { Database } from "sqlite3";

export class VaultsTableRow {
  constructor(public id: string, public name: string, public fsPath: string) {}
}

export class VaultsTableUtils {
  static async createTable(db: Database) {
    const sql = `
    CREATE TABLE IF NOT EXISTS Vaults (
      id INTEGER PRIMARY KEY,
      name TEXT,
      fsPath TEXT
    )`;

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        console.log(err);
        resolve();
      });
    });
    // TODO: Return error
  }

  static getIdByFsPath(db: Database, fsPath: string) {
    const sql = `
SELECT id FROM Vaults
WHERE fsPath = '${fsPath}'
`;

    return new Promise((resolve) => {
      db.get(sql, (err, row) => {
        // debugger;

        resolve(row.id);
      });
    });
  }

  static insert(db: Database, row: Omit<VaultsTableRow, "id">) {
    const sql = `
INSERT INTO Vaults (name, fsPath)
VALUES (
  '${row.name}',
  '${row.fsPath}'
);`;

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        console.log(err);
        resolve();
      });
    });
  }

  static delete(_db: Database, _from: string) {}
}
