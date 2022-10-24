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
        console.log(err);
        resolve();
      });
    });

    // TODO: Return error
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
        console.log(err);
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
        console.log(err);
        resolve();
      });
    });
  }
}
