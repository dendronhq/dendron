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

  static bulkInsertLinkWithSourceAsFname(
    db: Database,
    data: {
      sinkId: string;
      sourceFname: string;
      linkType: LinkType;
      payload?: DLink;
    }[]
  ) {
    const values = data
      .map(
        (d) =>
          `('${d.sourceFname}','${d.sinkId}','${d.linkType}',${
            d.payload ? "'" + JSON.stringify(d.payload) + "'" : "NULL"
          })`
      )
      .join(",");

    const sql = `
INSERT OR IGNORE INTO Links (source, sink, linkType, payload)
WITH T(fname, sink, linkType, payload) as 
(VALUES ${values})
SELECT NoteProps.id, T.sink, T.linkType, T.payload FROM T
JOIN NoteProps ON T.fname = NoteProps.fname
  `;

    // debugger;
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

  static insertLinkWithSourceAsFname(
    db: Database,
    sinkId: string,
    sourceFname: string,
    linkType: LinkType,
    payload?: DLink
  ) {
    // debugger;
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

  static bulkInsertLinkWithSinkAsFname(
    db: Database,
    data: {
      sourceId: string;
      sinkFname: string;
      linkType: LinkType;
      payload?: DLink;
    }[]
  ) {
    const values = data
      .map(
        (d) =>
          `('${d.sourceId}','${d.sinkFname}','${d.linkType}',${
            d.payload ? "'" + JSON.stringify(d.payload) + "'" : "NULL"
          })`
      )
      .join(",");

    const sql = `
INSERT OR IGNORE INTO Links (source, sink, linkType, payload)
WITH T(source, fname, linkType, payload) as 
(VALUES ${values})
SELECT T.source, NoteProps.id, T.linkType, T.payload FROM T
JOIN NoteProps ON T.fname = NoteProps.fname
  `;

    // debugger;
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

  // Anything that shows up in NotePropsMeta.links (this includes forward and
  // backlinks, excludes parent/children)
  static getAllDLinks(db: Database, sourceId: string): Promise<DLink[]> {
    const sql = `
SELECT source, sink, linkType, payload
FROM Links
WHERE (source = '${sourceId}' OR sink = '${sourceId}') AND linkType != 1
    `;

    return new Promise<DLink[]>((resolve) => {
      const dlinks: DLink[] = [];

      db.all(sql, (err, rows: LinksTableRow[]) => {
        if (err) {
          // debugger;
          // TODO: reject error
        } else {
          rows
            // .filter((row) => row.type !== "child")
            .map((row) => {
              // Forward Links:
              if (row.source === sourceId && row.payload) {
                dlinks.push(JSON.parse(row.payload as unknown as string)); // TODO - prolly need to change type in LinksTableRow to string instead of DLink
              } else if (row.sink === sourceId) {
                const dlink: DLink = JSON.parse(
                  row.payload as unknown as string
                );

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
