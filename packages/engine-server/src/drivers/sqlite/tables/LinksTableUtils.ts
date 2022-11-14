import { DLink } from "@dendronhq/common-all";
import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import {
  executeSqlWithVoidResult,
  getIntegerString,
  getSQLValueString,
} from "../SQLiteUtils";

// TODO Should be an enum...
export type LinkType =
  | "ref"
  | "wiki"
  | "md"
  | "linkCandidate"
  | "frontmatterTag"
  | "child";

export class LinksTableRow {
  constructor(
    public source: string, // NOTE: These are ID's, not fnames!
    public sink: string, // NOTE: These are ID's, not fnames!
    public type: LinkType,
    public linkValue?: string,
    public payload?: DLink
  ) {}
}

export class LinksTableUtils {
  public static createTable(db: Database): ResultAsync<void, SqliteError> {
    const sql = `
    CREATE TABLE IF NOT EXISTS Links (
      source TEXT NOT NULL,
      sink TEXT,
      linkType INTEGER,
      linkValue TEXT,
      payload TEXT,
      PRIMARY KEY (source, linkType, linkValue, payload),
      FOREIGN KEY(source) REFERENCES NoteProps(id) ON DELETE CASCADE,
      FOREIGN KEY(sink) REFERENCES NoteProps(id) ON DELETE CASCADE
    ) WITHOUT ROWID;`;

    const idx = `CREATE INDEX IF NOT EXISTS idx_Links_source ON Links (source)`;

    const idx2 = `CREATE INDEX IF NOT EXISTS idx_Links_sink ON Links (sink)`;

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

  static bulkInsertLinkWithSinkAsFname(
    db: Database,
    data: {
      sourceId: string;
      sinkFname: string;
      linkType: LinkType;
      linkValue: string;
      payload?: DLink;
    }[]
  ): ResultAsync<void, SqliteError> {
    const values = data
      .map(
        (d) =>
          `('${d.sourceId}','${
            d.sinkFname
          }',${LinksTableUtils.getSQLValueForLinkType(d.linkType)},'${
            d.linkValue
          }',${d.payload ? "'" + JSON.stringify(d.payload) + "'" : "NULL"})`
      )
      .join(",");

    const sql = `
      INSERT OR IGNORE INTO Links (source, sink, linkType, linkValue, payload)
      WITH T(source, fname, linkType, linkValue, payload) AS 
      (VALUES ${values})
      SELECT T.source, NoteProps.id, T.linkType, T.linkValue, T.payload FROM T
      LEFT OUTER JOIN NoteProps ON T.fname = NoteProps.fname`;

    return executeSqlWithVoidResult(db, sql);
  }

  /**
   * Use this method when you have the ID of the source and the fname of the
   * sink. This method will lookup into the NoteProps table to get ID's for the
   * sink (if any valid ID's exist). This is
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
    linkValue: string,
    payload: DLink
  ): ResultAsync<void, SqliteError> {
    return LinksTableUtils.bulkInsertLinkWithSinkAsFname(db, [
      { sourceId, sinkFname, linkType, linkValue, payload },
    ]);
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
      WHERE (source = '${noteId}' OR sink = '${noteId}')`;

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
      case "wiki":
        return 1;
      case "md":
        return 2;
      case "ref":
        return 3;
      case "frontmatterTag":
        return 4;
      default:
        return 0;
    }
  }

  private static getSQLInsertString(props: LinksTableRow): string {
    const sql = `
      INSERT INTO Links (source, sink, linkType, linkValue, payload)
      VALUES (
        ${getSQLValueString(props.source)},
        ${getSQLValueString(props.sink)},
        ${getIntegerString(LinksTableUtils.getSQLValueForLinkType(props.type))},
        ${getSQLValueString(props.linkValue)},
        ${getSQLValueString(
          props.payload ? JSON.stringify(props.payload) : undefined
        )})
        `;

    return sql;
  }
}
