import { DNodePointer } from "@dendronhq/common-all";
import { okAsync, ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { SqliteQueryUtils } from "../SqliteQueryUtils";

export class HierarchyTableRow {
  constructor(public parent: string, public child: string) {}
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
    VALUES ('${row.parent}', '${row.child}')`;

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
      .map((row) => `('${row.parent}', '${row.child}')`)
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

  /**
   * Given a domain,
   * recursively grab all descendants of the domain
   * until we run out
   *
   * return all (parent, child) pairs
   *
   * more on recursive CTEs: https://www.sqlite.org/lang_with.html
   */
  public static getAllInDomain(
    db: Database,
    domainId: string
  ): ResultAsync<HierarchyTableRow[], SqliteError> {
    const sql = [
      `WITH RECURSIVE "cte_hierarchy" (parent, child) AS (`, // 1. create a view (cte)
      `  SELECT h.parent, h.child`, // 2. select a root note to anchor to. this is the domain note
      `  FROM "Hierarchy" h`,
      `  WHERE h.parent = "${domainId}"`, // 3. at this point cte_hierarchy has one row queued
      `  UNION ALL`, // UNION ALL assuming we don't have dupes in the hierarchy table
      `  SELECT h.parent, h.child`,
      `  FROM "Hierarchy" h`, // 4. we are going to join the hierarchy table
      `  JOIN "cte_hierarchy" c ON c.child = h.parent`, // 5. to the cte until we run out of children
      `)`,
      `SELECT * FROM "cte_hierarchy"`, // 6. select everything from the created view.
    ].join("\n");

    return SqliteQueryUtils.all(db, sql);
  }
}
