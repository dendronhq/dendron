import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { executeSqlWithVoidResult } from "../SQLiteUtils";

export class VaultNotesTableRow {
  constructor(public vaultId: number, public noteId: string) {}
}

/**
 * Utilities for read/write on the VaultNotes Table in sqlite
 */
export class VaultNotesTableUtils {
  static createTable(db: Database): ResultAsync<null, SqliteError> {
    const sql = `
    CREATE TABLE IF NOT EXISTS VaultNotes (
      vaultId INTEGER NOT NULL,
      noteId TEXT NOT NULL,
      PRIMARY KEY (vaultId, noteId),
      FOREIGN KEY(vaultId) REFERENCES Vaults(id) ON DELETE CASCADE,
      FOREIGN KEY(noteId) REFERENCES NoteProps(id) ON DELETE CASCADE);`;

    const idx = `CREATE INDEX IF NOT EXISTS idx_VaultNotes_noteId ON VaultNotes (noteId)`;

    return executeSqlWithVoidResult(db, sql).andThen(() => {
      return executeSqlWithVoidResult(db, idx);
    });
  }

  static getVaultFsPathForNoteId(
    db: Database,
    noteId: string
  ): ResultAsync<string, SqliteError> {
    const sql = `
      SELECT fsPath FROM VaultNotes
      JOIN Vaults ON Vaults.id = VaultNotes.vaultId
      WHERE noteId = '${noteId}';`;

    const prom = new Promise<string>((resolve, reject) => {
      db.get(sql, (err, row) => {
        if (err) {
          reject(err.message);
        } else if (!row) {
          reject(
            new SqliteError(`No note or vault found for note with ID ${noteId}`)
          );
        } else {
          resolve(row.fsPath);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }

  static insert(
    db: Database,
    row: VaultNotesTableRow
  ): ResultAsync<null, SqliteError> {
    const sql = `
      INSERT INTO VaultNotes (vaultId, noteId)
      VALUES (
        ${row.vaultId},
        '${row.noteId}'
      );`;

    return executeSqlWithVoidResult(db, sql);
  }

  static bulkInsert(
    db: Database,
    rows: VaultNotesTableRow[]
  ): ResultAsync<null, SqliteError> {
    const values = rows
      .map((row) => `('${row.vaultId}', '${row.noteId}')`)
      .join(",");

    const sql = `
      INSERT INTO VaultNotes (vaultId, noteId)
      VALUES ${values}`;

    return executeSqlWithVoidResult(db, sql);
  }

  static delete(
    db: Database,
    row: VaultNotesTableRow
  ): ResultAsync<null, SqliteError> {
    const sql = `
      DELETE FROM VaultNotes
      WHERE vaultId = ${row.vaultId} AND noteId = '${row.noteId}';`;

    return executeSqlWithVoidResult(db, sql);
  }
}
