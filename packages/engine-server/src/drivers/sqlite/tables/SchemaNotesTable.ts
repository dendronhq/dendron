import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { getSQLValueString } from "./SQLiteUtils";

export class SchemaNotesTableRow {
  constructor(
    public noteId: string,
    public moduleId: string,
    public schemaId: string
  ) {}
}

export class SchemaNotesTableUtils {
  static async createTable(db: Database) {
    const sql = `
    CREATE TABLE IF NOT EXISTS SchemaNotes (
      noteId TEXT NOT NULL,
      moduleId TEXT NOT NULL,
      schemaId TEXT NOT NULL,
      PRIMARY KEY (noteId, moduleId, schemaId),
      FOREIGN KEY(noteId) REFERENCES NoteProps(id) ON DELETE CASCADE
);`;

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        // console.log(err);
        resolve();
      });
    });
    // TODO: Return error
  }

  static insert(
    db: Database,
    row: SchemaNotesTableRow
  ): ResultAsync<void, SqliteError> {
    const sql = this.getSQLInsertString(row);

    const prom = new Promise<void>((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) {
          debugger;
          reject(err.message);
        } else {
          // debugger;
          resolve();
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      // debugger;
      return e as SqliteError;
    });
  }

  private static getSQLInsertString(props: SchemaNotesTableRow): string {
    const sql = `
    INSERT OR IGNORE INTO SchemaNotes (noteId, moduleId, schemaId)
VALUES (
  ${getSQLValueString(props.noteId)},
  ${getSQLValueString(props.moduleId)},
  ${getSQLValueString(props.schemaId)})
  `;
    return sql;
  }
}
