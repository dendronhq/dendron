/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
import {
  DendronError,
  DNodePointer,
  DVault,
  ERROR_SEVERITY,
  ERROR_STATUS,
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
  VaultNotesTableRow,
  VaultNotesTableUtils,
  VaultsTableUtils,
} from "./tables";
import { SchemaNotesTableUtils } from "./tables/SchemaNotesTable";

export class SqliteMetadataStore implements IDataStore<string, NotePropsMeta> {
  constructor(private _db: Database, private _vaults: DVault[]) {}

  async get(key: string): Promise<RespV3<NotePropsMeta>> {
    const props = await NotePropsTableUtils.getById(this._db, key);

    if (!props) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `NoteProps metadata not found for key ${key}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
    // TODO: package response from the err, row

    // TODO: Optimize
    // this._db.parallelize(() => {

    // });
    const links = await LinksTableUtils.getAllDLinks(this._db, key);

    const children = await this.getChildren(key);

    const parent = await this.getParent(key);

    const vaultFsPath = await VaultNotesTableUtils.getVaultFsPathForNoteId(
      this._db,
      key
    );

    const vault = this._vaults.find((vault) => vault.fsPath === vaultFsPath);

    if (!vault) {
      throw new Error(`Unable to find vault for note with ID ${key}`);
    }

    const data: NotePropsMeta = {
      parent,
      children,
      links,
      id: props.id,
      fname: props.fname,
      title: props.title,
      desc: props.description,
      updated: props.updated,
      created: props.created,
      anchors: JSON.parse(props.anchors),
      stub: props.stub === 1,
      custom: props.custom,
      color: props.color,
      image: JSON.parse(props.image),
      traits: JSON.parse(props.traits),
      data: undefined,
      type: "note",
      vault,
    };

    return {
      data,
    };
  }

  // TODO: If the query building requirements starts to get more complex, maybe
  // we can consider using a library such as knex.js https://knexjs.org/
  async find(opts: FindNoteOpts): Promise<RespV3<NotePropsMeta[]>> {
    // debugger;
    // Special case: if no arguments are passed, return nothing.
    if (
      opts.excludeStub === undefined &&
      opts.fname === undefined &&
      opts.vault === undefined
    ) {
      return {
        data: [],
      };
    }

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

    const links = await new Promise((resolve) => {
      this._db.all(sql, (_err, rows) => {
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

    const vaultId = await VaultsTableUtils.getIdByFsPath(
      this._db,
      data.vault.fsPath
    );
    await VaultNotesTableUtils.insert(
      this._db,
      new VaultNotesTableRow(vaultId as number, data.id) // TODO: Remove cast
    );

    if (data.schema) {
      await SchemaNotesTableUtils.insert(this._db, {
        noteId: data.id,
        moduleId: data.schema.moduleId,
        schemaId: data.schema.schemaId,
      });
    }

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
          // resolve({
          //   error: "Delete Failed",
          // });
        } else {
          resolve({
            data: key,
          });
        }
      });
    });

    return resp;
  }

  // TODO: Move to LinksTableUtils
  private async getChildren(key: string): Promise<DNodePointer[]> {
    const childrenSql = `
    SELECT sink FROM Links
    WHERE source = '${key}' AND linkType = 1`;

    return new Promise((resolve) => {
      this._db.all(childrenSql, (_err, rows) => {
        // debugger;

        const children = rows.map((row) => row.sink) as DNodePointer[];
        resolve(children);
      });
    });
  }

  // TODO: Move to LinksTableUtils
  private async getParent(key: string): Promise<DNodePointer | null> {
    const parentSql = `
    SELECT source FROM Links
    where sink = '${key}' AND linkType = 1`;

    return new Promise((resolve) => {
      this._db.get(parentSql, (_err, row) => {
        if (row && row.source) {
          resolve(row.source);
        } else {
          resolve(null);
        }
      });
    });
  }
}
