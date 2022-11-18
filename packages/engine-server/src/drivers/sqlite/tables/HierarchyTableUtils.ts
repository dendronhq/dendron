import { DNodePointer } from "@dendronhq/common-all";
import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { executeSqlWithVoidResult } from "../SQLiteUtils";

export class HierarchyTableRow {
  constructor(
    // NOTE: These are ID's, not fnames!
    public parent: string,
    public child: string
  ) {}
}

export class HierarchyTableUtils {
  public static createTable(db: Database): ResultAsync<null, SqliteError> {
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

    return executeSqlWithVoidResult(db, sql)
      .andThen(() => {
        return executeSqlWithVoidResult(db, idx);
      })
      .andThen(() => {
        return executeSqlWithVoidResult(db, idx2);
      });
  }

  public static insert(
    db: Database,
    row: HierarchyTableRow
  ): ResultAsync<null, SqliteError> {
    const sql = `
    INSERT INTO Hierarchy (parent, child)
    VALUES (('${row.parent}', '${row.child}'))`;

    return executeSqlWithVoidResult(db, sql);
  }

  public static bulkInsert(
    db: Database,
    rows: HierarchyTableRow[]
  ): ResultAsync<null, SqliteError> {
    const values = rows
      .map((row) => `('${row.parent}', '${row.child}')`)
      .join(",");

    const sql = `
    INSERT INTO Hierarchy (parent, child)
    VALUES ${values}`;

    return executeSqlWithVoidResult(db, sql);
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

    return executeSqlWithVoidResult(db, sql);
  }

  public static getChildren(
    db: Database,
    noteId: string
  ): ResultAsync<DNodePointer[], SqliteError> {
    const childrenSql = `
    SELECT child FROM Hierarchy
    WHERE parent = '${noteId}'`;

    const prom = new Promise<DNodePointer[]>((resolve, reject) => {
      db.all(childrenSql, (err, rows) => {
        if (err) {
          reject(err.message);
        }

        const children = rows.map((row) => row.child) as DNodePointer[];
        resolve(children);
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }

  public static getParent(
    db: Database,
    noteId: string
  ): ResultAsync<DNodePointer | null, SqliteError> {
    const parentSql = `
    SELECT parent FROM Hierarchy
    where child = '${noteId}'`;

    const prom = new Promise<DNodePointer | null>((resolve, reject) => {
      db.get(parentSql, (err, row) => {
        if (err) {
          reject(err.message);
        }

        if (row && row.parent) {
          resolve(row.parent);
        } else {
          resolve(null);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }
}
