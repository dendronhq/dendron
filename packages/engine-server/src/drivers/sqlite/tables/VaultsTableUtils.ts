import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { executeSqlWithVoidResult } from "../SQLiteUtils";

export class VaultsTableRow {
  constructor(public id: number, public name: string, public fsPath: string) {}
}

export class VaultsTableUtils {
  static createTable(db: Database): ResultAsync<null, SqliteError> {
    const sql = `
    CREATE TABLE IF NOT EXISTS Vaults (
      id INTEGER PRIMARY KEY,
      name TEXT,
      fsPath TEXT
    )`;

    const sqlIndex = `
    CREATE UNIQUE INDEX IF NOT EXISTS idx_vaults_fsPath ON Vaults ('fsPath')`;

    return executeSqlWithVoidResult(db, sql).andThen(() => {
      return executeSqlWithVoidResult(db, sqlIndex);
    });
  }

  static getIdByFsPath(
    db: Database,
    fsPath: string
  ): ResultAsync<number, SqliteError> {
    const sql = `
      SELECT id FROM Vaults
      WHERE fsPath = '${fsPath}'`;

    const prom = new Promise<number>((resolve, reject) => {
      db.get(sql, (err, row) => {
        if (err) {
          reject(err.message);
        } else if (row) {
          resolve(row.id);
        } else {
          reject(new Error(`No vault with fsPath ${fsPath} found.`));
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }

  static insert(
    db: Database,
    row: Omit<VaultsTableRow, "id">
  ): ResultAsync<null, SqliteError> {
    const sql = `
      INSERT INTO Vaults (name, fsPath)
      VALUES (
        '${row.name}',
        '${row.fsPath}'
      );`;

    return executeSqlWithVoidResult(db, sql);
  }
}
