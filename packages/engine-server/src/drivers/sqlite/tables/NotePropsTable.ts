import { NotePropsMeta } from "@dendronhq/common-all";
import { ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import { SqliteError } from "../SqliteError";
import { LinkType } from "./LinksTable";
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
  constructor(public from: string, public to: string, public type: LinkType) {}
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
      db.run(sql, (err) => {
        // console.log(err);
        resolve();
      });
    });
    // TODO: Return error
  }

  static insert(
    db: Database,
    row: NotePropsMeta
  ): ResultAsync<void, SqliteError> {
    const sql = this.getSQLInsertString(row);

    const prom = new Promise<void>((resolve, reject) => {
      db.run(sql, (err) => {
        if (err) {
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

  static delete(_db: Database, _from: string) {}

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
  `;
    return sql;
  }
}
