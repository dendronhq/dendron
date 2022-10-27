import { NotePropsMeta } from "@dendronhq/common-all";
import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import {
  getIntegerString,
  getJSONString,
  getSQLBoolean,
  getSQLValueString,
} from "./SQLiteUtils";

// NoteProps : PK TEXT id
// NoteProps : TEXT fname
// NoteProps : TEXT title
// NoteProps : TEXT desc
// NoteProps : INTEGER updated
// NoteProps : INTEGER created
// NoteProps : TEXT anchors
// NoteProps : BOOLEAN stub
// NoteProps : TEXT custom
// NoteProps : TEXT color
// NoteProps : TEXT image
// NoteProps : TEXT traits

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
    public color: string,
    public image: string,
    public traits: string
  ) {}
}

export class NotePropsTableUtils {
  static async createTable(db: Database) {
    const sql = `
CREATE TABLE IF NOT EXISTS NoteProps (
  id TEXT PRIMARY KEY,
  fname TEXT NOT NULL,
  title TEXT,
  description TEXT,
  updated INTEGER,
  created INTEGER,
  anchors TEXT,
  stub BOOLEAN,
  custom TEXT,
  color TEXT,
  image TEXT,
  traits TEXT
);`;

    return new Promise<void>((resolve) => {
      db.run(sql, (_err) => {
        console.log(_err);
        // console.log(err);
        resolve();
      });
    });
    // TODO: Return error
  }

  static getById(db: Database, id: string): Promise<NotePropsTableRow> {
    const sql = `SELECT * FROM NoteProps WHERE id = '${id}'`;

    return new Promise<NotePropsTableRow>((resolve, _reject) => {
      db.get(sql, (err, row) => {
        if (err) {
          // debugger;
          // reject(err.message);
        } else {
          // debugger;
          resolve(row as NotePropsTableRow);
        }
      });
    });
  }

  static insert(
    db: Database,
    row: NotePropsMeta
  ): ResultAsync<void, SqliteError> {
    const sql = this.getSQLInsertString(row);

    const prom = new Promise<void>((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) {
          // debugger;
          reject(err.message);
        } else {
          // debugger;
          resolve();
        }
      });
    });

    return ResultAsync.fromPromise(prom, (e) => {
      // debugger;
      return e as SqliteError;
    });
  }

  // static delete(_db: Database, _from: string) {}

  private static getSQLInsertString(props: NotePropsMeta): string {
    const sql = `
INSERT INTO NoteProps (id, fname, title, description, updated, created, anchors, stub, custom, color, image, traits)
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
color = ${getSQLValueString(props.color)},
image = ${getJSONString(props.image)},
traits = ${getJSONString(props.traits)}
  `;
    return sql;
  }
}
