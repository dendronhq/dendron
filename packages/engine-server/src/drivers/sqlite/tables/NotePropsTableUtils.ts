import {
  NotePropsMeta,
  errAsync,
  okAsync,
  ResultAsync,
} from "@dendronhq/common-all";
import { Database } from "sqlite3";
import { SqliteError, SqliteErrorType } from "../SqliteError";
import { SqliteQueryUtils } from "../SqliteQueryUtils";
import {
  getIntegerString,
  getJSONString,
  getSQLBoolean,
  getSQLValueString,
} from "../SqliteTypeUtils";

export class NotePropsTableRow {
  constructor(
    public id: string,
    public fname: string,
    public title: string,
    public description: string,
    public updated: number,
    public created: number,
    public anchors: string,
    public stub: number,
    public custom: string,
    public contentHash: string,
    public color: string,
    public image: string,
    public traits: string
  ) {}
}

export class NotePropsTableUtils {
  /**
   * Create the NoteProps table in the given sqlite database
   * @param db
   * @returns
   */
  public static createTable(db: Database): ResultAsync<null, SqliteError> {
    const sql = `
      CREATE TABLE IF NOT EXISTS NoteProps (
        id TEXT NOT NULL PRIMARY KEY,
        fname TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        updated INTEGER,
        created INTEGER,
        anchors TEXT,
        stub BOOLEAN,
        custom TEXT,
        contentHash TEXT,
        color TEXT,
        image TEXT,
        traits TEXT);`;

    const idx = `CREATE INDEX IF NOT EXISTS idx_NoteProps_fname ON NoteProps (fname)`;

    return SqliteQueryUtils.run(db, sql).andThen(() => {
      return SqliteQueryUtils.run(db, idx);
    });
  }

  /**
   * Get a row by the note id
   * @param db
   * @param id
   * @returns ResultAsync containing the NotePropsTableRow if it exists,
   * otherwise null if a row with the id doesn't exist.
   */
  public static getById(
    db: Database,
    id: string
  ): ResultAsync<NotePropsTableRow | null, SqliteError> {
    const sql = `SELECT * FROM NoteProps WHERE id = '${id}'`;

    return SqliteQueryUtils.get(db, sql).map((row) => row ?? null);
  }

  /**
   * Get all rows by fname
   * @param db
   * @param fname
   * @returns
   */
  public static getByFname(
    db: Database,
    fname: string
  ): ResultAsync<NotePropsTableRow[], SqliteError> {
    const sql = `SELECT * FROM NoteProps WHERE fname = '${fname}'`;

    return SqliteQueryUtils.all(db, sql).andThen((rows) => {
      if (!rows) {
        const err: SqliteError = {
          type: SqliteErrorType.NoResults,
          query: sql,
          name: SqliteErrorType.NoResults,
          message: `No rows with fname ${fname} found`,
        };
        return errAsync(err);
      }
      return okAsync(rows as NotePropsTableRow[]);
    });
  }

  public static getHashByFnameAndVaultId(
    db: Database,
    fname: string,
    vaultId: number
  ): ResultAsync<string | null, SqliteError> {
    const sql = `
      SELECT contentHash
      FROM NoteProps
      JOIN VaultNotes ON VaultNotes.noteId = NoteProps.id
      WHERE fname = '${fname}'
      AND VaultNotes.vaultId = ${vaultId}`;

    return SqliteQueryUtils.get(db, sql).map((row) =>
      row ? row.contentHash : null
    );
  }

  /**
   * Insert a NoteProp object in the NoteProps sqlite table
   * @param db
   * @param row
   * @returns
   */
  public static insert(
    db: Database,
    row: NotePropsMeta
  ): ResultAsync<null, SqliteError> {
    const sql = this.getSQLInsertString(row);

    return SqliteQueryUtils.run(db, sql);
  }

  public static delete(
    db: Database,
    key: string
  ): ResultAsync<null, SqliteError> {
    const sql = `DELETE FROM NoteProps
    WHERE id = '${key}'`;

    return SqliteQueryUtils.run(db, sql);
  }

  private static getSQLInsertString(props: NotePropsMeta): string {
    const sql = `
    INSERT INTO NoteProps (id, fname, title, description, updated, created, anchors, stub, custom, contentHash, color, image, traits)
    VALUES (
      ${getSQLValueString(props.id)},
      ${getSQLValueString(props.fname)},
      ${getSQLValueString(props.title)},
      ${getSQLValueString(props.desc)},
      ${getIntegerString(props.updated)},
      ${getIntegerString(props.created)},
      ${getJSONString(props.anchors)},
      ${getSQLBoolean(props.stub)},
      ${getJSONString(props.custom)},
      ${getSQLValueString(props.contentHash)},
      ${getSQLValueString(props.color)},
      ${getJSONString(props.image)},
      ${getJSONString(props.traits)})
    ON CONFLICT(id) DO UPDATE
    SET
      fname = ${getSQLValueString(props.fname)},
      title = ${getSQLValueString(props.title)},
      description = ${getSQLValueString(props.desc)},
      updated = ${getIntegerString(props.updated)},
      created = ${getIntegerString(props.created)},
      anchors = ${getJSONString(props.anchors)},
      stub = ${getSQLBoolean(props.stub)},
      custom = ${getJSONString(props.custom)},
      contentHash = ${getSQLValueString(props.contentHash)},
      color = ${getSQLValueString(props.color)},
      image = ${getJSONString(props.image)},
      traits = ${getJSONString(props.traits)}`;
    return sql;
  }
}
