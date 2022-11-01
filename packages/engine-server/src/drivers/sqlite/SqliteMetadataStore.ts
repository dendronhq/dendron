/* eslint-disable no-empty-function */
/* eslint-disable no-useless-constructor */
import {
  DendronError,
  DVault,
  FindNoteOpts,
  IDataStore,
  IDendronError,
  NotePropsMeta,
  RespV3,
} from "@dendronhq/common-all";
import _ from "lodash";
import { err, ok, Result, ResultAsync } from "neverthrow";
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

  dispose() {
    this._db.close();
  }

  public async get(key: string): Promise<RespV3<NotePropsMeta>> {
    const finalResult = await this._get(key);

    if (finalResult.isOk()) {
      return {
        data: finalResult.value,
      };
    } else {
      return {
        error: new DendronError({ message: "Something went wrong with get" }), // TODO: Refine
      };
    }
  }

  private _get(key: string): ResultAsync<NotePropsMeta, any> {
    const getNotePropsResult = NotePropsTableUtils.getById(this._db, key);

    const getDLinksResult = LinksTableUtils.getAllDLinks(this._db, key);

    const getChildrenResult = LinksTableUtils.getChildren(this._db, key);

    const getParentResult = LinksTableUtils.getParent(this._db, key);

    const getVaultResult = VaultNotesTableUtils.getVaultFsPathForNoteId(
      this._db,
      key
    ).andThen<Result<DVault, Error>>((fsPath) => {
      const vault = this._vaults.find((vault) => vault.fsPath === fsPath);

      if (!vault) {
        return err(new Error(`Unable to find vault for note with ID ${key}`));
      } else {
        return ok(vault);
      }
    });

    return ResultAsync.combineWithAllErrors([
      getNotePropsResult,
      getDLinksResult,
      getChildrenResult,
      getParentResult,
      getVaultResult,
    ]).map((results) => {
      const row = results[0];
      const links = results[1];
      const children = results[2];
      const parent = results[3];
      const vault = results[4];

      const data: NotePropsMeta = {
        parent,
        children,
        links,
        id: row.id,
        fname: row.fname,
        title: row.title,
        desc: row.description,
        updated: row.updated,
        created: row.created,
        anchors: JSON.parse(row.anchors),
        stub: row.stub === 1,
        custom: row.custom,
        contentHash: row.contentHash,
        color: row.color,
        image: JSON.parse(row.image),
        traits: JSON.parse(row.traits),
        data: undefined,
        type: "note",
        vault,
      };

      return data;
    });
  }

  // TODO: If the query building requirements starts to get more complex, maybe
  // we can consider using a library such as knex.js https://knexjs.org/
  async find(opts: FindNoteOpts): Promise<RespV3<NotePropsMeta[]>> {
    debugger;
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
    let vaultJoinClause = ` `;
    if (opts.vault) {
      const vaultIdResponse = await VaultsTableUtils.getIdByFsPath(
        this._db,
        opts.vault.fsPath
      );

      if (vaultIdResponse.isErr()) {
        return {
          error: vaultIdResponse.error,
        };
      }

      vaultJoinClause = `JOIN VaultNotes ON NoteProps.id = VaultNotes.noteId `;
      vaultClause = `VaultNotes.vaultId = ${vaultIdResponse.value}`;
    }

    const sql = `
    SELECT id FROM NoteProps
    ${vaultJoinClause}
    WHERE
    ${_.join([fNameConditionalClause, excludeStubClause, vaultClause], " AND ")}
    `;

    try {
      const ids = await new Promise<string[]>((resolve, reject) => {
        let ids: string[] = [];

        this._db.all(sql, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            ids = rows.map((row) => row.id);
            resolve(ids);
          }
        });
      });

      // debugger;

      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await this._get(id);

          // debugger;
          if (res.isOk()) {
            return res.value;
          }
          return undefined;
        })
      );

      const data = _.compact(results);

      return {
        data,
      };
    } catch (e) {
      return {
        error: e as IDendronError,
      };
    }
  }

  async write(key: string, data: NotePropsMeta): Promise<RespV3<string>> {
    const insertResult = await NotePropsTableUtils.insert(this._db, data);

    if (insertResult.isErr()) {
      return {
        error: insertResult.error,
      };
    }

    const vaultId = await VaultsTableUtils.getIdByFsPath(
      this._db,
      data.vault.fsPath
    );

    if (vaultId.isErr()) {
      return {
        error: vaultId.error,
      };
    }

    // In case we are changing vaults, the row must be deleted first and then
    // reinserted.
    const vaultNotesDeleteResult = await VaultNotesTableUtils.delete(
      this._db,
      new VaultNotesTableRow(vaultId.value, data.id)
    );

    if (vaultNotesDeleteResult.isErr()) {
      return {
        error: vaultNotesDeleteResult.error,
      };
    }

    const vaultNotesInsertResult = await VaultNotesTableUtils.insert(
      this._db,
      new VaultNotesTableRow(vaultId.value, data.id)
    );

    if (vaultNotesInsertResult.isErr()) {
      return {
        error: vaultNotesInsertResult.error,
      };
    }

    // First we need to clear any existing links
    const linksDeleteResult = await LinksTableUtils.delete(this._db, key);

    if (linksDeleteResult.isErr()) {
      return {
        error: linksDeleteResult.error,
      };
    }

    // Now add links
    await Promise.all(
      data.links.map((link) => {
        return LinksTableUtils.insert(
          this._db,
          new LinksTableRow(data.id, link.to!.id!, link.type as LinkType, link) // TODO: Get rid of to!.id! after Tuling's change.
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

    if (data.schema) {
      await SchemaNotesTableUtils.insert(this._db, {
        noteId: data.id,
        moduleId: data.schema.moduleId,
        schemaId: data.schema.schemaId,
      });
    }

    return { data: key };
  }

  async delete(key: string): Promise<RespV3<string>> {
    const result = await NotePropsTableUtils.delete(this._db, key);
    if (result.isOk()) {
      return {
        data: key,
      };
    } else {
      return {
        error: result.error,
      };
    }
  }
}
