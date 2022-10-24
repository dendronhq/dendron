/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
import {
  DLink,
  DNodePointer,
  FindNoteOpts,
  IDataStore,
  NotePropsMeta,
  RespV3,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Database } from "sqlite3";
import {
  LinksTableRow,
  LinksTableUtils,
  LinkType,
  NotePropsTableUtils,
  VaultsTableUtils,
} from "./tables";

export class SqliteMetadataStore implements IDataStore<string, NotePropsMeta> {
  constructor(private _db: Database) {}

  async get(key: string): Promise<RespV3<NotePropsMeta>> {
    // TODO: package response from the err, row

    const linksSql = `
    SELECT payload FROM Links
    WHERE source = '${key}' AND linkType != 1`;

    const links = await new Promise((resolve) => {
      this._db.all(linksSql, (err, rows) => {
        // debugger;
        const links = rows.map((row) => row.payload as DLink);
        resolve(links);
      });
    });

    const children = await this.getChildren(key);

    const parent = await this.getParent(key);

    const props = await new Promise<any>((resolve) => {
      this._db.get(
        `SELECT * FROM NoteProps WHERE id = '${key}'`,
        (err, row) => {
          // debugger;
          resolve(row);
        }
      );
    });

    const data: NotePropsMeta = {
      parent,
      children,
      ...props, // TODO: Need to massage missing properties and description->desc
      links,
    };

    return {
      data,
    };
  }

  // TODO: If the query building requirements starts to get more complex, maybe
  // we can consider using a library such as knex.js https://knexjs.org/
  async find(opts: FindNoteOpts): Promise<RespV3<NotePropsMeta[]>> {
    const fNameConditionalClause = opts.fname
      ? `fname = '${opts.fname}'`
      : `1 = 1`;

    const excludeStubClause = opts.excludeStub ? `stub = 0` : `1 = 1`;

    let vaultClause = `1 = 1`;
    let vaultJoinClase = ` `;
    if (opts.vault) {
      const vaultId = await VaultsTableUtils.getIdByFsPath(
        this._db,
        opts.vault.fsPath
      );

      vaultJoinClase = `JOIN VaultNotes ON NoteProps.id = VaultNotes.noteId `;
      vaultClause = `VaultNotes.vaultId = ${vaultId}`;
    }

    const sql = `
    SELECT id FROM NoteProps
    ${vaultJoinClase}
    WHERE
    ${_.join([fNameConditionalClause, excludeStubClause, vaultClause], " AND ")}
    `;

    debugger;
    const links = await new Promise((resolve) => {
      this._db.all(sql, (err, rows) => {
        const props = Promise.all(
          rows.map(async (row) => {
            const resp = await this.get(row.id);

            return resp.data;
          })
        );
        resolve(props);
      });
    });

    return {
      data: links as NotePropsMeta[],
    };
  }

  async write(key: string, data: NotePropsMeta): Promise<RespV3<string>> {
    await NotePropsTableUtils.insert(this._db, data);

    // First we need to clear any existing links
    await LinksTableUtils.delete(this._db, key);

    // Now add links
    await Promise.all(
      data.links.map((link) => {
        return LinksTableUtils.insert(
          this._db,
          new LinksTableRow(data.id, link.to!.id!, link.type as LinkType, link)
        );
      })
    );

    // Now add children
    await Promise.all(
      data.children.map((child) => {
        return LinksTableUtils.insert(
          this._db,
          new LinksTableRow(data.id, child, "child")
        );
      })
    );

    // Now add the parent-> child link (where this note is the child):
    if (data.parent) {
      await LinksTableUtils.insert(
        this._db,
        new LinksTableRow(data.parent, data.id, "child")
      );
    }

    return { data: key };
  }

  delete(key: string): Promise<RespV3<string>> {
    const deleteSQL = `
DELETE FROM NoteProps
WHERE id = '${key}'
`;

    const resp = new Promise<RespV3<string>>((resolve) => {
      this._db.run(deleteSQL, (err) => {
        if (err) {
          debugger;
          resolve({
            error: "Delete Failed",
          });
        } else {
          resolve({
            data: key,
          });
        }
      });
    });

    return resp;
  }

  private async getChildren(key: string): Promise<DNodePointer[]> {
    const childrenSql = `
    SELECT sink FROM Links
    WHERE source = '${key}' AND linkType = 1`;

    return new Promise((resolve) => {
      this._db.all(childrenSql, (err, rows) => {
        // debugger;

        const children = rows.map((row) => row.sink) as DNodePointer[];
        resolve(children);
      });
    });
  }

  private async getParent(key: string): Promise<DNodePointer | null> {
    const parentSql = `
    SELECT source FROM Links
    where sink = '${key}' AND linkType = 1`;

    return new Promise((resolve) => {
      this._db.get(parentSql, (err, row) => {
        // debugger;

        resolve(row.source);
        //TODO: What if there are 0 results, need to resolve null.
      });
    });
  }
}
