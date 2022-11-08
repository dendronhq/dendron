import { Database } from "sqlite3";

export enum SqliteTableNames {
  NoteProps = "NoteProps",
  Links = "Links",
  Vaults = "Vaults",
  VaultNotes = "VaultNotes",
}

export class SqliteTestUtils {
  public static async getRowCountForTable(
    db: Database,
    table: SqliteTableNames
  ) {
    const sql = `
    SELECT COUNT(*) AS count FROM ${table}`;

    return new Promise<void>((resolve, reject) => {
      db.get(sql, (err, row) => {
        if (err) {
          reject(err.message);
        } else {
          resolve(row.count);
        }
      });
    });
  }
}
