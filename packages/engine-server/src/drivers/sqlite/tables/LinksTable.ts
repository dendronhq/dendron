/* eslint-disable no-useless-constructor */
/* eslint-disable no-empty-function */

import { DLink, DNodePointer } from "@dendronhq/common-all";
import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import {
  executeSqlWithVoidResult,
  getIntegerString,
  getSQLValueString,
} from "./SQLiteUtils";

// TODO Should be an enum...
export type LinkType =
  | "ref"
  | "wiki"
  | "md"
  // | "backlink"
  // | "linkCandidate"
  | "frontmatterTag"
  | "child";

export class LinksTableRow {
  constructor(
    public source: string, // NOTE: These are ID's, not fnames!
    public sink: string, // NOTE: These are ID's, not fnames!
    public type: LinkType,
    public payload?: DLink
  ) {}
}

export class LinksTableUtils {
  public static createTable(db: Database): ResultAsync<void, SqliteError> {
    const sql = `
CREATE TABLE IF NOT EXISTS Links (
  source TEXT NOT NULL,
  sink TEXT NOT NULL,
  linkType INTEGER,
  payload TEXT,
  PRIMARY KEY (source, sink, linkType),
  FOREIGN KEY(source) REFERENCES NoteProps(id) ON DELETE CASCADE,
  FOREIGN KEY(sink) REFERENCES NoteProps(id) ON DELETE CASCADE
) WITHOUT ROWID;`;

    return executeSqlWithVoidResult(db, sql);
  }

  public static insert(
    db: Database,
    row: LinksTableRow
  ): ResultAsync<void, SqliteError> {
    const sql = this.getSQLInsertString(row);

    const prom = new Promise<void>((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) {
          if (
            err.message === "SQLITE_CONSTRAINT: FOREIGN KEY constraint failed"
          ) {
            reject(
              new SqliteError(
                `NoteProps for either source id ${row.source} or sink id ${row.sink} not found in NoteProps table.`
              )
            );
          } else {
            reject(err.message);
          }
        } else {
          resolve();
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }

  static bulkInsertLinkWithSourceAsFname(
    db: Database,
    data: {
      sinkId: string;
      sourceFname: string;
      linkType: LinkType;
      payload?: DLink;
    }[]
  ): ResultAsync<void, SqliteError> {
    const values = data
      .map(
        (d) =>
          `('${d.sourceFname}','${
            d.sinkId
          }',${LinksTableUtils.getSQLValueForLinkType(d.linkType)},${
            d.payload ? "'" + JSON.stringify(d.payload) + "'" : "NULL"
          })`
      )
      .join(",");

    const sql = `
INSERT INTO Links (source, sink, linkType, payload)
WITH T(fname, sink, linkType, payload) as 
(VALUES ${values})
SELECT NoteProps.id, T.sink, T.linkType, T.payload FROM T
JOIN NoteProps ON T.fname = NoteProps.fname
  `;

    return executeSqlWithVoidResult(db, sql);
  }

  static insertLinkWithSourceAsFname(
    db: Database,
    sinkId: string,
    sourceFname: string,
    linkType: LinkType,
    payload?: DLink
  ): ResultAsync<void, SqliteError> {
    const select = payload ? `'${JSON.stringify(payload)}'` : "NULL";

    const sql = `
      INSERT INTO Links (source, sink, linkType, payload)
      SELECT id, '${sinkId}', ${LinksTableUtils.getSQLValueForLinkType(
      linkType
    )}, ${select}
      FROM NoteProps
      WHERE fname = '${sourceFname}'`;

    return executeSqlWithVoidResult(db, sql);
  }

  static bulkInsertLinkWithSinkAsFname(
    db: Database,
    data: {
      sourceId: string;
      sinkFname: string;
      linkType: LinkType;
      payload?: DLink;
    }[]
  ): ResultAsync<void, SqliteError> {
    const values = data
      .map(
        (d) =>
          `('${d.sourceId}','${
            d.sinkFname
          }',${LinksTableUtils.getSQLValueForLinkType(d.linkType)},${
            d.payload ? "'" + JSON.stringify(d.payload) + "'" : "NULL"
          })`
      )
      .join(",");

    const sql = `
      INSERT OR IGNORE INTO Links (source, sink, linkType, payload)
      WITH T(source, fname, linkType, payload) as 
      (VALUES ${values})
      SELECT T.source, NoteProps.id, T.linkType, T.payload FROM T
      JOIN NoteProps ON T.fname = NoteProps.fname`;

    return executeSqlWithVoidResult(db, sql);
  }

  /**
   * Use this method when you have the ID of the source and the fname of the
   * sink. This method will lookup into the NoteProps table to get ID's for the
   * sink (if any valid ID's exist)
   * @param db
   * @param sourceId
   * @param sinkFname
   * @param linkType
   * @param payload
   * @returns
   */
  public static insertLinkWithSinkAsFname(
    db: Database,
    sourceId: string,
    sinkFname: string,
    linkType: LinkType,
    payload: DLink
  ): ResultAsync<void, SqliteError> {
    const sql = `
INSERT INTO Links (source, sink, linkType, payload)
SELECT '${sourceId}', id, ${LinksTableUtils.getSQLValueForLinkType(
      linkType
    )}, '${JSON.stringify(payload) ?? {}}'
FROM NoteProps
WHERE fname = '${sinkFname}'`;

    return executeSqlWithVoidResult(db, sql);
  }

  public static getChildren(
    db: Database,
    key: string
  ): ResultAsync<DNodePointer[], SqliteError> {
    const childrenSql = `
    SELECT sink FROM Links
    WHERE source = '${key}' AND linkType = 1`;

    const prom = new Promise<DNodePointer[]>((resolve, reject) => {
      db.all(childrenSql, (err, rows) => {
        if (err) {
          reject(err.message);
        }

        const children = rows.map((row) => row.sink) as DNodePointer[];
        resolve(children);
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }

  public static getParent(
    db: Database,
    key: string
  ): ResultAsync<DNodePointer | null, SqliteError> {
    const parentSql = `
    SELECT source FROM Links
    where sink = '${key}' AND linkType = 1`;

    const prom = new Promise<DNodePointer | null>((resolve, reject) => {
      db.get(parentSql, (err, row) => {
        if (err) {
          reject(err.message);
        }

        if (row && row.source) {
          resolve(row.source);
        } else {
          resolve(null);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }

  /**
   *  For a note ID, get anything that shows up in NotePropsMeta.links (this
   *  includes forward and backlinks, excludes parent/children)
   * @param db
   * @param noteId
   * @returns
   */
  static getAllDLinks(
    db: Database,
    noteId: string
  ): ResultAsync<DLink[], SqliteError> {
    const sql = `
      SELECT source, sink, linkType, payload
      FROM Links
      WHERE (source = '${noteId}' OR sink = '${noteId}') AND linkType != 1`;

    const prom = new Promise<DLink[]>((resolve, reject) => {
      const dlinks: DLink[] = [];

      db.all(sql, (err: Error, rows: LinksTableRow[]) => {
        if (err) {
          reject(err.message);
        } else {
          rows.map((row) => {
            // Forward Links:
            if (row.source === noteId && row.payload) {
              dlinks.push(JSON.parse(row.payload as unknown as string)); // TODO - prolly need to change type in LinksTableRow to string instead of DLink
            } else if (row.sink === noteId) {
              const dlink: DLink = JSON.parse(row.payload as unknown as string);

              // TODO: Check to see how to properly translate a forward link to a backlink
              const backlink: DLink = {
                type: "backlink",
                value: dlink.value,
                from: dlink.from,
              };

              dlinks.push(backlink);
            }
          });

          resolve(dlinks);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
  }

  static delete(db: Database, source: string): ResultAsync<void, SqliteError> {
    const sql = `
      DELETE FROM Links
      WHERE source = '${source}'`;

    return executeSqlWithVoidResult(db, sql);
  }

  static getSQLValueForLinkType(type: LinkType): number {
    switch (type) {
      case "child":
        return 1;
      case "wiki":
        return 2;
      case "md":
        return 3;
      case "ref":
        return 4;
      case "frontmatterTag":
        return 5;
      default:
        return 0;
    }
  }

  private static getSQLInsertString(props: LinksTableRow): string {
    const sql = `
      INSERT INTO Links (source, sink, linkType, payload)
      VALUES (
        ${getSQLValueString(props.source)},
        ${getSQLValueString(props.sink)},
        ${getIntegerString(LinksTableUtils.getSQLValueForLinkType(props.type))},
        ${getSQLValueString(
          props.payload ? JSON.stringify(props.payload) : undefined
        )})
      ON CONFLICT(source, sink, linkType) DO UPDATE
      SET
        source = ${getSQLValueString(props.source)},
        sink = ${getSQLValueString(props.sink)},
        linkType = ${getIntegerString(
          LinksTableUtils.getSQLValueForLinkType(props.type)
        )},
        payload = ${getSQLValueString(
          props.payload ? JSON.stringify(props.payload) : undefined
        )}`;

    return sql;
  }
}
