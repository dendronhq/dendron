import { DLink, NotePropsMeta, ResultAsync } from "@dendronhq/common-all";
import _ from "lodash";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { SqliteQueryUtils } from "../SqliteQueryUtils";
import { getIntegerString, getSQLValueString } from "../SqliteTypeUtils";

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
    public sinkFname?: string,
    public sinkVaultName?: string,
    public payload?: DLink
  ) {}
}

export type LinksTableRowWithSinkAsFname = Omit<LinksTableRow, "sink"> & {
  sinkFname: string;
};

export class LinksTableUtils {
  public static createTable(db: Database): ResultAsync<null, SqliteError> {
    const sql = `
    CREATE TABLE IF NOT EXISTS Links (
      source TEXT NOT NULL,
      sink TEXT,
      linkType INTEGER,
      sinkFname TEXT, -- DNoteLoc property
      sinkVaultName TEXT, -- DNoteLoc property
      payload TEXT,
      PRIMARY KEY (source, sink, payload),
      FOREIGN KEY(source) REFERENCES NoteProps(id) ON DELETE CASCADE,
      FOREIGN KEY(sink) REFERENCES NoteProps(id) ON DELETE SET NULL
    )`;

    const idx = `CREATE INDEX IF NOT EXISTS idx_Links_source ON Links (source)`;

    const idx2 = `CREATE INDEX IF NOT EXISTS idx_Links_sink ON Links (sink)`;

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
    row: LinksTableRow
  ): ResultAsync<null, SqliteError> {
    const sql = `
    INSERT INTO Links (source, sink, linkType, sinkFname, sinkVaultName, payload)
    VALUES (
      ${getSQLValueString(row.source)},
      ${getSQLValueString(row.sink)},
      ${getIntegerString(LinksTableUtils.getSQLValueForLinkType(row.type))},
      ${getSQLValueString(row.sinkFname)},
      ${getSQLValueString(row.sinkVaultName)},
      ${getSQLValueString(
        row.payload ? JSON.stringify(row.payload) : undefined
      )})
      `;

    return SqliteQueryUtils.run(db, sql);
  }

  static bulkInsertLinkWithSinkAsFname(
    db: Database,
    data: LinksTableRowWithSinkAsFname[]
  ): ResultAsync<null, SqliteError> {
    const values = data
      .map(
        (d) =>
          `('${d.source}','${
            d.sinkFname
          }',${LinksTableUtils.getSQLValueForLinkType(
            d.type
          )},${getSQLValueString(d.sinkFname)},${getSQLValueString(
            d.sinkVaultName
          )},${d.payload ? "'" + JSON.stringify(d.payload) + "'" : "NULL"})`
      )
      .join(",");

    const sql = `
      INSERT OR IGNORE INTO Links (source, sink, linkType, sinkFname, sinkVaultName, payload)
      WITH T(source, fname, linkType, sinkFname, sinkVaultName, payload) AS
      (VALUES ${values})
      SELECT T.source, NoteProps.id, T.linkType, T.sinkFname, T.sinkVaultName, T.payload FROM T
      LEFT OUTER JOIN NoteProps ON T.fname = NoteProps.fname`;

    return SqliteQueryUtils.run(db, sql);
  }

  static bulkInsertLinkCandidatesWithSinkAsFname(
    db: Database,
    data: LinksTableRowWithSinkAsFname[]
  ): ResultAsync<null, SqliteError> {
    const values = data
      .map(
        (d) =>
          `('${d.source}','${
            d.sinkFname
          }',${LinksTableUtils.getSQLValueForLinkType(
            d.type
          )},${getSQLValueString(d.sinkFname)},${getSQLValueString(
            d.sinkVaultName
          )},${d.payload ? "'" + JSON.stringify(d.payload) + "'" : "NULL"})`
      )
      .join(",");

    const sql = `
      INSERT OR IGNORE INTO Links (source, sink, linkType, sinkFname, sinkVaultName, payload)
      WITH T(source, fname, linkType, sinkFname, sinkVaultName, payload) AS
      (VALUES ${values})
      SELECT T.source, NoteProps.id, T.linkType, T.sinkFname, T.sinkVaultName, T.payload FROM T
      JOIN NoteProps ON T.fname = NoteProps.fname`;

    return SqliteQueryUtils.run(db, sql);
  }

  static InsertLinksThatBecameAmbiguous(
    db: Database,
    data: { fname: string; id: string }[]
  ): ResultAsync<null, SqliteError> {
    const values = data
      .map((d) => `(${getSQLValueString(d.fname)},${getSQLValueString(d.id)})`)
      .join(",");

    const sql = `
      INSERT OR IGNORE INTO Links (source, sink, linkType, sinkFname, sinkVaultName, payload)
      WITH T(fname, id) AS
      (VALUES ${values})
      SELECT Links.source, T.id, Links.linkType, Links.sinkFname, Links.sinkVaultName, Links.payload
      FROM T
      JOIN Links ON Links.sinkFname = T.fname AND Links.sinkVaultName IS NULL`;

    return SqliteQueryUtils.run(db, sql);
  }

  /**
   * Use this method when you have the ID of the source and the fname of the
   * sink. This method will lookup into the NoteProps table to get ID's for the
   * sink (if any valid ID's exist). This is
   */
  public static insertLinkWithSinkAsFname(
    db: Database,
    data: LinksTableRowWithSinkAsFname
  ): ResultAsync<null, SqliteError> {
    return LinksTableUtils.bulkInsertLinkWithSinkAsFname(db, [data]);
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

    return SqliteQueryUtils.all(db, sql).map((rows) => {
      const dlinks: DLink[] = [];

      rows.map((row) => {
        // Forward Links:
        if (row.source === noteId && row.payload) {
          dlinks.push(JSON.parse(row.payload as unknown as string)); // TODO - prolly need to change type in LinksTableRow to string instead of DLink
        } else if (row.sink === noteId) {
          const link: DLink = JSON.parse(row.payload as unknown as string);

          const backlink: DLink = {
            type: "backlink",
            value: link.value,
            position: link.position,
            from: link.from,
          };

          dlinks.push(backlink);
        }
      });

      // An ambiguous wikilink will have multiple entries in the links
      // table, so we need to dedupe here:
      return _.uniqWith(dlinks, _.isEqual);
    });
  }

  static delete(db: Database, source: string): ResultAsync<null, SqliteError> {
    const sql = `
      DELETE FROM Links
      WHERE source = '${source}'`;

    return SqliteQueryUtils.run(db, sql);
  }

  public static updateUnresolvedLinksForAddedNotes(
    db: Database,
    addedNotes: NotePropsMeta[],
    vaultNameOfNotesGettingAdded: string
  ): ResultAsync<null, SqliteError> {
    const values = addedNotes
      .map(
        (props) =>
          `('${props.fname}','${props.id}','${vaultNameOfNotesGettingAdded}')`
      )
      .join(",");

    // TODO: Handle cross-vault link syntax in the linkValue
    const sql = `
    UPDATE Links
    SET sink = AddedNotes.newId
    FROM
    (
      WITH T(fname, id, vaultName) AS
        (VALUES ${values})
        SELECT T.id AS newId, Links.source, links.payload
        FROM T
        JOIN Links ON Links.sinkFname = T.fname AND Links.sink IS NULL AND (Links.sinkVaultName = T.vaultName OR Links.sinkVaultName IS NULL)
    ) AS AddedNotes
    WHERE Links.source = AddedNotes.source
    AND Links.payload = AddedNotes.payload`;

    return SqliteQueryUtils.run(db, sql);
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
}
