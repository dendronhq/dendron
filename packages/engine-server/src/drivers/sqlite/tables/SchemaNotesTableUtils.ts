import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { executeSqlWithVoidResult, getSQLValueString } from "./SQLiteUtils";

export class SchemaNotesTableRow {
  constructor(
    public noteId: string,
    public moduleId: string,
    public schemaId: string
  ) {}
}

export class SchemaNotesTableUtils {
  static createTable(db: Database): ResultAsync<void, SqliteError> {
    const sql = `
    CREATE TABLE IF NOT EXISTS SchemaNotes (
      noteId TEXT NOT NULL,
      moduleId TEXT NOT NULL,
      schemaId TEXT NOT NULL,
      PRIMARY KEY (noteId, moduleId, schemaId),
      FOREIGN KEY(noteId) REFERENCES NoteProps(id) ON DELETE CASCADE);`;

    return executeSqlWithVoidResult(db, sql);
  }

  static insert(
    db: Database,
    row: SchemaNotesTableRow
  ): ResultAsync<void, SqliteError> {
    const sql = `
    INSERT OR IGNORE INTO SchemaNotes (noteId, moduleId, schemaId)
    VALUES (
      ${getSQLValueString(row.noteId)},
      ${getSQLValueString(row.moduleId)},
      ${getSQLValueString(row.schemaId)})`;

    const prom = new Promise<void>((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) {
          reject(err.message);
        } else {
          resolve();
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }
}
