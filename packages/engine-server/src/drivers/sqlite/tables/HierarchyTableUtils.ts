import { DNodePointer } from "@dendronhq/common-all";
import { okAsync, ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { SqliteQueryUtils } from "../SqliteQueryUtils";

export class HierarchyTableRow {
  constructor(public parentId: string, public childId: string) {}
}

export class HierarchyTableUtils {
  public static createTable(db: Database): ResultAsync<null, SqliteError> {
    // The DELETE CASCADE makes it such that whenever the foreign key note is
    // deleted in the NoteProps table, the corresponding rows are also deleted
    // in this Hierarchy table.
    const sql = `
    CREATE TABLE IF NOT EXISTS Hierarchy (
      parent TEXT NOT NULL,
      child TEXT NOT NULL,
      PRIMARY KEY (parent, child),
      FOREIGN KEY(parent) REFERENCES NoteProps(id) ON DELETE CASCADE,
      FOREIGN KEY(child) REFERENCES NoteProps(id) ON DELETE CASCADE
    ) WITHOUT ROWID;`;

    const idx = `CREATE INDEX IF NOT EXISTS idx_Links_source ON Hierarchy (parent)`;

    const idx2 = `CREATE INDEX IF NOT EXISTS idx_Links_sink ON Hierarchy (child)`;

    return SqliteQueryUtils.run(db, sql)
      .andThen(() => {
        return SqliteQueryUtils.run(db, idx);
      })
      .andThen(() => {
        return SqliteQueryUtils.run(db, idx2);
      });
  }

  public static insert(
    db: Database,
    row: HierarchyTableRow
  ): ResultAsync<null, SqliteError> {
    const sql = `
    INSERT OR IGNORE INTO Hierarchy (parent, child)
    VALUES ('${row.parentId}', '${row.childId}')`;

    return SqliteQueryUtils.run(db, sql);
  }

  public static bulkInsert(
    db: Database,
    rows: HierarchyTableRow[]
  ): ResultAsync<null, SqliteError> {
    if (rows.length === 0) {
      return okAsync(null);
    }

    const values = rows
      .map((row) => `('${row.parentId}', '${row.childId}')`)
      .join(",");

    const sql = `
    INSERT OR IGNORE Hierarchy (parent, child)
    VALUES ${values}`;

    return SqliteQueryUtils.run(db, sql);
  }

  public static insertWithParentAsFname(
    db: Database,
    childId: string,
    parentFname: string,
    vaultId: number
  ): ResultAsync<null, SqliteError> {
    return this.bulkInsertWithParentAsFname(db, [
      { childId, parentFname, vaultId },
    ]);
  }

  public static bulkInsertWithParentAsFname(
    db: Database,
    data: {
      childId: string;
      parentFname: string;
      vaultId: number;
    }[]
  ): ResultAsync<null, SqliteError> {
    if (data.length === 0) {
      return okAsync(null);
    }

    const values = data
      .map((d) => `('${d.childId}', '${d.parentFname}', ${d.vaultId})`)
      .join(",");

    const sql = `
      INSERT INTO Hierarchy (parent, child)
      WITH T(childId, parentFname, vaultId) AS
      (VALUES ${values})
      SELECT NoteProps.id, T.childId FROM T
      JOIN NoteProps ON T.parentFname = NoteProps.fname
      JOIN VaultNotes ON VaultNotes.noteId = NoteProps.id
      WHERE VaultNotes.vaultId = T.vaultId`;

    return SqliteQueryUtils.run(db, sql);
  }

  public static getChildren(
    db: Database,
    noteId: string
  ): ResultAsync<DNodePointer[], SqliteError> {
    const childrenSql = `
    SELECT child FROM Hierarchy
    WHERE parent = '${noteId}'`;

    return SqliteQueryUtils.all(db, childrenSql).map(
      (rows) => rows.map((row) => row.child) as DNodePointer[]
    );
  }

  public static getParent(
    db: Database,
    noteId: string
  ): ResultAsync<DNodePointer | null, SqliteError> {
    const parentSql = `
    SELECT parent FROM Hierarchy
    where child = '${noteId}'`;

    return SqliteQueryUtils.get(db, parentSql).map((row) => {
      if (row && row.parent) {
        return row.parent;
      } else {
        return null;
      }
    });
  }
}
