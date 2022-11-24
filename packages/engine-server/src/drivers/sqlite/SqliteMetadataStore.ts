import {
  DendronError,
  DVault,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  IDataStore,
  IDendronError,
  NotePropsMeta,
  QueryNotesOpts,
  RespV3,
  StatusCodes,
} from "@dendronhq/common-all";
import _ from "lodash";
import { err, ok, Result, ResultAsync } from "neverthrow";
import { Database } from "sqlite3";
import {
  HierarchyTableRow,
  HierarchyTableUtils,
  LinksTableUtils,
  LinkType,
  NotePropsFtsTableUtils,
  NotePropsTableUtils,
  VaultNotesTableRow,
  VaultNotesTableUtils,
  VaultsTableUtils,
} from "./tables";
import { SchemaNotesTableUtils } from "./tables/SchemaNotesTableUtils";

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
        // Parity error message with NoteMetadataStore
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `NoteProps metadata not found for key ${key}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  private _get(key: string): ResultAsync<NotePropsMeta, any> {
    const getNotePropsResult = NotePropsTableUtils.getById(this._db, key);

    const getDLinksResult = LinksTableUtils.getAllDLinks(this._db, key);

    const getChildrenResult = HierarchyTableUtils.getChildren(this._db, key);

    const getParentResult = HierarchyTableUtils.getParent(this._db, key);

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
        desc: row.description ?? "",
        updated: row.updated,
        created: row.created,
        anchors: JSON.parse(row.anchors) ?? {},
        stub: row.stub === 1,
        custom: JSON.parse(row.custom) ?? undefined,
        contentHash: row.contentHash,
        color: row.color ?? undefined,
        image: JSON.parse(row.image) ?? undefined,
        traits: JSON.parse(row.traits) ?? undefined,
        data: {},
        type: "note",
        vault,
      };

      return data;
    });
  }

  // TODO: If the query building requirements starts to get more complex, maybe
  // we can consider using a library such as knex.js https://knexjs.org/
  async find(opts: FindNoteOpts): Promise<RespV3<NotePropsMeta[]>> {
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

      const results = await Promise.all(
        ids.map(async (id) => {
          const res = await this._get(id);

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
        return LinksTableUtils.insertLinkWithSinkAsFname(this._db, {
          source: data.id,
          sinkFname: link.value,
          type: link.type as LinkType,
          sinkVaultName: link.to?.vaultName,
          payload: link,
        });
      })
    );

    // Potentially any unresolved links now are resolved with the addition of this note
    if (data.vault.name) {
      const updateUnresolvedLinksForAddedNotesResult =
        await LinksTableUtils.updateUnresolvedLinksForAddedNotes(
          this._db,
          [data],
          data.vault.name
        );

      if (updateUnresolvedLinksForAddedNotesResult.isErr()) {
        return {
          error: updateUnresolvedLinksForAddedNotesResult.error,
        };
      }
    }

    // Potentially some links became ambiguous
    const insertLinksThatBecameAmbiguousResult =
      await LinksTableUtils.InsertLinksThatBecameAmbiguous(this._db, [
        { fname: data.fname, id: data.id },
      ]);

    if (insertLinksThatBecameAmbiguousResult.isErr()) {
      return {
        error: insertLinksThatBecameAmbiguousResult.error,
      };
    }

    // Now add children
    await Promise.all(
      data.children.map(async (child) => {
        const childInsertResult = await HierarchyTableUtils.insert(
          this._db,
          new HierarchyTableRow(data.id, child)
        );

        if (childInsertResult.isErr()) {
          // TODO: Handle
        }
        return childInsertResult;
      })
    );

    // Now add the parent-> child link (where this note is the child):
    if (data.parent) {
      const parentInsertResult = await HierarchyTableUtils.insert(
        this._db,
        new HierarchyTableRow(data.parent, data.id)
      );

      if (parentInsertResult.isErr()) {
        return {
          error: parentInsertResult.error,
        };
      }
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

  query(
    opts: QueryNotesOpts
  ): ResultAsync<NotePropsMeta[], IDendronError<StatusCodes | undefined>> {
    // Special case: return all root notes
    if (opts.qs === "") {
      const result = NotePropsTableUtils.getByFname(this._db, "root");

      return result.andThen((rows) => {
        const ids = rows.map((row) => row.id);

        const mappingResult = ids.map((id) => {
          return this._get(id);
        });

        return ResultAsync.combine(mappingResult);
      }) as ResultAsync<
        NotePropsMeta[],
        IDendronError<StatusCodes | undefined>
      >;
    }
    // if (qs === "") {
    //   const results = this.notesIndex.search("root");
    //   items = _.map(
    //     _.filter(results, (ent) => ent.item.fname === "root"),
    //     (ent) => ent.item
    //   );
    //   /// seearch eveyrthing
    // } else if (qs === "*") {
    //   // @ts-ignore
    //   items = this.notesIndex._docs as NoteProps[];
    // }

    const res = NotePropsFtsTableUtils.query(this._db, opts.qs);

    return res.andThen((ids) => {
      const mappingResult = ids.map((id) => {
        return this._get(id);
      });

      return ResultAsync.combine(mappingResult);
    }) as ResultAsync<NotePropsMeta[], IDendronError<StatusCodes | undefined>>;
  }
}
