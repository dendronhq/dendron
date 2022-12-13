import { errAsync, okAsync, ResultAsync } from "@dendronhq/common-all";
import { Database } from "sqlite3";
import { SqliteError, SqliteErrorType } from "../SqliteError";
import { SqliteQueryUtils } from "../SqliteQueryUtils";

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

    return SqliteQueryUtils.run(db, sql).andThen(() => {
      return SqliteQueryUtils.run(db, sqlIndex);
    });
  }

  static getIdByFsPath(
    db: Database,
    fsPath: string
  ): ResultAsync<number, SqliteError> {
    const sql = `
      SELECT id FROM Vaults
      WHERE fsPath = '${fsPath}'`;

    return SqliteQueryUtils.get(db, sql).andThen((row) => {
      if (!row) {
        const err: SqliteError = {
          type: SqliteErrorType.NoResults,
          query: sql,
          name: SqliteErrorType.NoResults,
          message: `No vault with fsPath ${fsPath} found.`,
        };
        return errAsync(err);
      }
      return okAsync(row.id as number);
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

    return SqliteQueryUtils.run(db, sql);
  }
}
