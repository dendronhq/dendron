/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
import { NotePropsMeta } from "@dendronhq/common-all";
import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import {
  executeSqlWithVoidResult,
  getIntegerString,
  getJSONString,
  getSQLBoolean,
  getSQLValueString,
} from "./SQLiteUtils";

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
  public static createTable(db: Database): ResultAsync<void, SqliteError> {
    const sql = `
      CREATE TABLE IF NOT EXISTS NoteProps (
        id TEXT NOT NULL PRIMARY KEY,
        fname TEXT NOT NULL,
        title TEXT,
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

    return executeSqlWithVoidResult(db, sql).andThen(() => {
      return executeSqlWithVoidResult(db, idx);
    });
  }

  /**
   * Get a row by the note id
   * @param db
   * @param id
   * @returns
   */
  public static getById(
    db: Database,
    id: string
  ): ResultAsync<NotePropsTableRow, SqliteError> {
    const sql = `SELECT * FROM NoteProps WHERE id = '${id}'`;

    const prom = new Promise<NotePropsTableRow>((resolve, reject) => {
      db.get(sql, (err, row) => {
        if (err) {
          reject(err.message);
        } else if (!row) {
          reject(new Error(`No row with id ${id} found`));
        } else {
          resolve(row as NotePropsTableRow);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
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

    const prom = new Promise<string | null>((resolve, reject) => {
      db.get(sql, (err, row) => {
        if (err) {
          reject(err.message);
        } else if (!row) {
          resolve(null);
        } else {
          resolve(row.contentHash as string);
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      return e as SqliteError;
    });
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
  ): ResultAsync<void, SqliteError> {
    const sql = this.getSQLInsertString(row);

    return executeSqlWithVoidResult(db, sql);
  }

  public static delete(
    db: Database,
    key: string
  ): ResultAsync<void, SqliteError> {
    const sql = `DELETE FROM NoteProps
    WHERE id = '${key}'`;

    return executeSqlWithVoidResult(db, sql);
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
traits = ${getJSONString(props.traits)}
  `;
    return sql;
  }
}
