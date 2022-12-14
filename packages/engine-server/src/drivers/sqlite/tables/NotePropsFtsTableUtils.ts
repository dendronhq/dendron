import { ResultAsync } from "@dendronhq/common-all";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { SqliteQueryUtils } from "../SqliteQueryUtils";

/**
 * FTS5 Virtual Table for Full-Text-Search over fname column in NoteProps. This
 * is to power lookup.
 */
export class NotePropsFtsTableUtils {
  static createTable(db: Database): ResultAsync<null, SqliteError> {
    // The Sqlite library doesn't appear to be able to execute multiple SQL
    // statements in the same block, so they must be separated into different
    // db.run() statements.
    const sql = `
    CREATE VIRTUAL TABLE IF NOT EXISTS NoteProps_fts USING fts5(content=[NoteProps], id UNINDEXED, fname);
    `;

    const sql2 = `CREATE TRIGGER IF NOT EXISTS NoteProps_after_insert AFTER INSERT ON NoteProps
    BEGIN
      INSERT INTO NoteProps_fts(id, fname) VALUES (new.id, new.fname);
      INSERT INTO NoteProps_fts(NoteProps_fts) VALUES('rebuild');
    END;`;

    const sql3 = `CREATE TRIGGER IF NOT EXISTS NoteProps_after_update AFTER UPDATE ON NoteProps
    BEGIN
      UPDATE NoteProps_fts
      SET fname = new.fname
      WHERE id = new.id;
      INSERT INTO NoteProps_fts(NoteProps_fts) VALUES('rebuild');
    END;`;

    const sql4 = `CREATE TRIGGER IF NOT EXISTS NoteProps_after_delete AFTER DELETE ON NoteProps
    BEGIN
      DELETE FROM NoteProps_fts WHERE id=old.id;
      INSERT INTO NoteProps_fts(NoteProps_fts) VALUES('rebuild');
    END;`;

    const sql5 = `INSERT INTO NoteProps_fts(NoteProps_fts) VALUES('rebuild');`;

    return SqliteQueryUtils.run(db, sql)
      .andThen(() => {
        return SqliteQueryUtils.run(db, sql2);
      })
      .andThen(() => {
        return SqliteQueryUtils.run(db, sql3);
      })
      .andThen(() => {
        return SqliteQueryUtils.run(db, sql4);
      })
      .andThen(() => {
        return SqliteQueryUtils.run(db, sql5);
      });
  }

  /**
   *
   * @param db
   * @param query
   * @returns list of noteIDs that are matches
   */
  static query(
    db: Database,
    query: string
  ): ResultAsync<string[], SqliteError> {
    query = NotePropsFtsTableUtils.transformQuery(query).join(" ");

    const sql = `SELECT id FROM NoteProps_fts WHERE fname MATCH 'NEAR(${query})'`;

    return SqliteQueryUtils.all(db, sql).map((rows) =>
      rows.map((row) => row.id)
    );
  }

  /**
   * Transform queries for sqlite syntax. All queries become prefix queries.
   * So "foo bar" becomes "foo* bar*"
   */
  private static transformQuery(query: string): string[] {
    return query.split(" ").map((ent) => `"${ent}"*`);
  }
}
