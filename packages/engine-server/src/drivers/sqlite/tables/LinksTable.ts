/* eslint-disable no-empty-function */

import { DLink } from "@dendronhq/common-all";
import { Database } from "sqlite3";
import { getIntegerString, getSQLValueString } from "./SQLiteUtils";

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
  static async createTable(db: Database) {
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

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        // console.log(err);
        resolve();
      });
    });
    // TODO: Return error
  }

  static insert(db: Database, row: LinksTableRow) {
    const sql = this.getSQLInsertString(row);
    // debugger;

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        // console.log(err);

        if (err) {
          // debugger;
        }
        resolve();
      });
    });
  }

  static insertLinkWithSourceAsFname(
    db: Database,
    sinkId: string,
    sourceFname: string,
    linkType: LinkType,
    payload?: DLink
  ) {
    const select = payload ? `'${JSON.stringify(payload)}'` : "NULL";

    const sql = `
INSERT INTO Links (source, sink, linkType, payload)
SELECT id, '${sinkId}', ${LinksTableUtils.getSQLValueForLinkType(
      linkType
    )}, ${select}
FROM NoteProps
WHERE fname = '${sourceFname}'`;

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        // debugger;
        // console.log(err);

        if (err) {
          // debugger;
        }
        resolve();
      });
    });
  }

  static insertLinkWithSinkAsFname(
    db: Database,
    sourceId: string,
    sinkFname: string,
    linkType: LinkType,
    payload: DLink
  ) {
    const sql = `
INSERT INTO Links (source, sink, linkType, payload)
SELECT '${sourceId}', id, ${LinksTableUtils.getSQLValueForLinkType(
      linkType
    )}, '${JSON.stringify(payload) ?? {}}'
FROM NoteProps
WHERE fname = '${sinkFname}'`;

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        // console.log(err);

        if (err) {
          // debugger;
        }
        resolve();
      });
    });
  }

  static delete(db: Database, source: string) {
    const sql = `DELETE FROM Links
WHERE source = '${source}'`;

    return new Promise<void>((resolve) => {
      db.run(sql, (err) => {
        // console.log(err);

        if (err) {
          // debugger;
        }
        resolve();
      });
    });
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
    )}
    )`;
    return sql;
  }
}
