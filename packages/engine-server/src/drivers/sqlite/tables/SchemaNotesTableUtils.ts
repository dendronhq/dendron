import { ResultAsync } from "@dendronhq/common-all";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { SqliteQueryUtils } from "../SqliteQueryUtils";
import { getSQLValueString } from "../SqliteTypeUtils";

export class SchemaNotesTableRow {
  constructor(
    public noteId: string,
    public moduleId: string,
    public schemaId: string
  ) {}
}

export class SchemaNotesTableUtils {
  static createTable(db: Database): ResultAsync<null, SqliteError> {
    const sql = `
    CREATE TABLE IF NOT EXISTS SchemaNotes (
      noteId TEXT NOT NULL,
      moduleId TEXT NOT NULL,
      schemaId TEXT NOT NULL,
      PRIMARY KEY (noteId, moduleId, schemaId),
      FOREIGN KEY(noteId) REFERENCES NoteProps(id) ON DELETE CASCADE);`;

    return SqliteQueryUtils.run(db, sql);
  }

  static insert(
    db: Database,
    row: SchemaNotesTableRow
  ): ResultAsync<null, SqliteError> {
    const sql = `
    INSERT OR IGNORE INTO SchemaNotes (noteId, moduleId, schemaId)
    VALUES (
      ${getSQLValueString(row.noteId)},
      ${getSQLValueString(row.moduleId)},
      ${getSQLValueString(row.schemaId)})`;

    const prom = new Promise<null>((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(null);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }

  static truncate(db: Database): ResultAsync<null, SqliteError> {
    const sql = `DELETE FROM SchemaNotes`;
    return SqliteQueryUtils.run(db, sql);
  }

  static getByNoteId(db: Database, key: string) {
    const sql = [
      `SELECT *`,
      `FROM SchemaNotes`,
      `WHERE SchemaNotes.noteId = "${key}"`,
    ].join("\n");

    return SqliteQueryUtils.get(db, sql);
  }
}
