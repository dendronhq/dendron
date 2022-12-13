import {
  DLogger,
  DNodePointer,
  okAsync,
  ResultAsync,
} from "@dendronhq/common-all";
import _ from "lodash";
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
      parentId TEXT NOT NULL,
      childId TEXT NOT NULL,
      PRIMARY KEY (parentId, childId),
      FOREIGN KEY(parentId) REFERENCES NoteProps(id) ON DELETE CASCADE,
      FOREIGN KEY(childId) REFERENCES NoteProps(id) ON DELETE CASCADE
    ) WITHOUT ROWID;`;

    const idx = `CREATE INDEX IF NOT EXISTS idx_Links_source ON Hierarchy (parentId)`;

    const idx2 = `CREATE INDEX IF NOT EXISTS idx_Links_sink ON Hierarchy (childId)`;

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
    INSERT OR IGNORE INTO Hierarchy (parentId, childId)
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
    INSERT OR IGNORE Hierarchy (parentId, childId)
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
      INSERT INTO Hierarchy (parentId, childId)
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
    SELECT childId FROM Hierarchy
    WHERE parentId = '${noteId}'`;

    return SqliteQueryUtils.all(db, childrenSql).map(
      (rows) => rows.map((row) => row.childId) as DNodePointer[]
    );
  }

  public static getParent(
    db: Database,
    noteId: string
  ): ResultAsync<DNodePointer | null, SqliteError> {
    const parentSql = `
    SELECT parentId FROM Hierarchy
    where childId = '${noteId}'`;

    return SqliteQueryUtils.get(db, parentSql).map((row) => {
      if (row && row.parentId) {
        return row.parentId;
      } else {
        return null;
      }
    });
  }

  /**
   * Given a node,
   * recursively grab all descendants of the node
   * until we run out
   *
   * return all (parentId, childId) pairs
   *
   * This is done in a breadth-first manner.
   *
   * more on recursive CTEs: https://www.sqlite.org/lang_with.html
   */
  public static getAllDescendants(
    db: Database,
    nodeId: string,
    logger?: DLogger
  ): ResultAsync<HierarchyTableRow[], SqliteError> {
    const sql = [
      // create a view (recursive cte)
      `WITH RECURSIVE "cte_hierarchy" (parentId, childId, depth, maxDepth) AS (`,
      // with the first SELECT before UNION ALL, we select a root note to anchor to
      // At this point, we queue up the root note to start the recursion.
      `  SELECT`,
      `    h.parentId,`,
      `    h.childId,`,
      `    1,`, // root note depth. starting from 1
      `    32`, // arbitrarily set maximum hierarchy depth. we can extend this support the worst case by setting it to (SELECT COUNT(*) FROM "Hierarchy")
      `  FROM "Hierarchy" h`,
      `  WHERE h.parentId = "${nodeId}"`,
      // UNION ALL assuming we don't have dupes in the hierarchy table.
      // This is needed to make this memory efficient.
      // If we switch this to UNION, the cte will hold all records of the rows until this query is done (to ensure no-dupe)
      // If we keep this as UNION ALL, sqlite will assume we never hit duplicate records and immediately consume the row and remove it from memory.
      // To ensure `Hierarchy` table indeed never has duplicates, we should add a check on INSERT.
      `  UNION ALL`,
      // With the second SELECT, we do the following
      // take the queued up root note, and see if we have a descendant that is also a parent of something else.
      // if we find them, we join it to the recursive cte.
      // this will queue the found results, which the cte will consume one by one until the queue runs out.
      // since we are queuing up immediate children of a root node, this is a BFS.
      `  SELECT`,
      `    h.parentId,`,
      `    h.childId,`,
      `    c.depth + 1,`, // incrementing cte's current depth by 1
      `    c.maxDepth`,
      `  FROM "Hierarchy" h`,
      `  JOIN "cte_hierarchy" c ON c.childId = h.parentId`,
      `  WHERE c.depth < c.maxDepth`, // we limit the recursion to the number of rows in the hierarchy table.
      `)`,
      // once the cte is completed, we select everything and return.
      `SELECT parentId, childId FROM "cte_hierarchy"`,
    ].join(" ");

    return SqliteQueryUtils.all(db, sql).andThen((rows) => {
      // this is done to remove duplicate in case the hierarchy table has a cycle.
      // we limit the tree traversal with a maxDepth, but we don't disallow insertion of (parentId, childId) rows
      // that will cause a cycle yet.
      // TODO: disallow cycle creating from INSERT and remove de-duping.
      const uniqueRows = _.uniqWith(rows, _.isEqual);
      if (uniqueRows.length < rows.length) {
        logger?.debug(
          "Duplicate hierarchy relation(s) detected and removed. Possible cycle in Hierarchy table."
        );
      }
      return okAsync(uniqueRows);
    });
  }
}
