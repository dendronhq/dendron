import { errAsync, okAsync, ResultAsync } from "@dendronhq/common-all";
import { Database } from "sqlite3";
import { SqliteError, SqliteErrorType } from "../SqliteError";
import { SqliteQueryUtils } from "../SqliteQueryUtils";

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

    return SqliteQueryUtils.run(db, sql).andThen(() => {
      return SqliteQueryUtils.run(db, idx);
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

    return SqliteQueryUtils.get(db, sql).andThen((row) => {
      if (!row) {
        const err: SqliteError = {
          type: SqliteErrorType.NoResults,
          query: sql,
          name: SqliteErrorType.NoResults,
          message: `No note or vault found for note with ID ${noteId}`,
        };
        return errAsync(err);
      }
      return okAsync(row.fsPath as string);
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

    return SqliteQueryUtils.run(db, sql);
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

    return SqliteQueryUtils.run(db, sql);
  }

  static delete(
    db: Database,
    row: VaultNotesTableRow
  ): ResultAsync<null, SqliteError> {
    const sql = `
      DELETE FROM VaultNotes
      WHERE vaultId = ${row.vaultId} AND noteId = '${row.noteId}';`;

    return SqliteQueryUtils.run(db, sql);
  }
}
