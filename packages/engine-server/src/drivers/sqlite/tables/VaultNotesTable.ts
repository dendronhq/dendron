/* eslint-disable no-empty-function */

import { Database } from "sqlite3";

export class VaultNotesTableRow {
  constructor(public vaultId: number, public noteId: string) {}
}

export class VaultNotesTableUtils {
  static async createTable(db: Database) {
    const sql = `
    CREATE TABLE IF NOT EXISTS VaultNotes (
      vaultId INTEGER,
      noteId TEXT,
      PRIMARY KEY (vaultId, noteId),
      FOREIGN KEY(vaultId) REFERENCES Vaults(id) ON DELETE CASCADE,
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

  // TODO: Vault Not Found Error Handling
  static getVaultFsPathForNoteId(db: Database, noteId: string) {
    const sql = `
    SELECT fsPath FROM VaultNotes
    JOIN Vaults ON Vaults.id = VaultNotes.vaultId
    WHERE noteId = '${noteId}';`;

    return new Promise<string>((resolve, reject) => {
      db.get(sql, (err, row) => {
        if (err) {
          // debugger;
          // reject(err.message);
        } else {
          // debugger;
          resolve(row?.fsPath ?? undefined);
        }
      });
    });
  }

  static insert(db: Database, row: VaultNotesTableRow) {
    const sql = `
INSERT INTO VaultNotes (vaultId, noteId)
VALUES (
  ${row.vaultId},
  '${row.noteId}'
);`;

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        // console.log(err);
        resolve();
      });
    });
  }

  static deleteNote(db: Database, noteId: string) {
    const sql = `
    DELETE FROM VaultNotes
    WHERE noteId = '${noteId}'
    `;

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        // console.log(err);
        resolve();
      });
    });
  }
}
