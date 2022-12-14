import {
  DendronError,
  DLink,
  DLogger,
  DVault,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  IDataStore,
  IDendronError,
  IFileStore,
  isNotUndefined,
  NoteDictsUtils,
  NoteProps,
  NotePropsMeta,
  QueryNotesOpts,
  RespV3,
  SchemaUtils,
  StatusCodes,
  err,
  errAsync,
  ok,
  okAsync,
  Result,
  ResultAsync,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Database } from "sqlite3";
import { SqliteDbFactory } from "./SqliteDbFactory";
import {
  HierarchyTableRow,
  HierarchyTableUtils,
  LinksTableUtils,
  LinkType,
  NotePropsFtsTableUtils,
  NotePropsTableRow,
  NotePropsTableUtils,
  VaultNotesTableRow,
  VaultNotesTableUtils,
  VaultsTableUtils,
} from "./tables";
import { SchemaNotesTableUtils } from "./tables/SchemaNotesTableUtils";

export class SqliteMetadataStore implements IDataStore<string, NotePropsMeta> {
  constructor(private _db: Database, private _vaults: DVault[]) {}

  /**
   * Goes through all domains and recursively apply schemas.
   */
  async initSchema(fileStore: IFileStore, wsRoot: string, logger: DLogger) {
    // TODO: move this whole thing to parseAllNoteFilesForSqlite / SqliteDbFactory
    const schemaResult = await SqliteDbFactory.initSchema(
      this._vaults,
      wsRoot,
      fileStore,
      logger
    );
    if (schemaResult.isErr()) {
      throw schemaResult.error;
    }
    const schemas = schemaResult.value;
    const rootNotesResult = await this.query({ qs: "", originalQS: "" });
    if (rootNotesResult.isErr()) {
      throw rootNotesResult.error;
    }
    const rootNotes = rootNotesResult.value;
    const rootNoteIds = rootNotes.map((rootNoteMeta) => {
      return rootNoteMeta.id;
    });

    // TODO: break this down
    await Promise.all(
      rootNoteIds.map(async (rootId) => {
        const rootNoteResp = await this.get(rootId);
        if (rootNoteResp.error) {
          throw rootNoteResp.error;
        } else {
          const domainIds = rootNoteResp.data.children;
          const allNoteIdsInDomains = _.uniq(
            _.flatten(
              await Promise.all(
                domainIds.map(async (domainId) => {
                  const getAllInDomainResult =
                    await HierarchyTableUtils.getAllDescendants(
                      this._db,
                      domainId,
                      logger
                    );
                  if (getAllInDomainResult.isErr()) {
                    throw getAllInDomainResult.error;
                  }
                  const allInDomainRows = getAllInDomainResult.value;
                  return [domainId].concat(
                    allInDomainRows.map((row) => {
                      return row.childId;
                    })
                  );
                })
              )
            )
          );
          // this is too expensive
          // we can probably create NoteDicts from just the query
          const allNotesInDomains = (
            await Promise.all(
              allNoteIdsInDomains.map(async (id) => {
                return (await this.get(id)).data;
              })
            )
          ).filter(isNotUndefined) as NoteProps[];
          const domainNotes = allNotesInDomains.filter((note) => {
            return !note.fname.includes(".");
          });

          const dicts = NoteDictsUtils.createNoteDicts(allNotesInDomains);
          domainNotes.forEach((domainNote) => {
            SchemaUtils.matchDomain(domainNote, dicts.notesById, schemas);
          });
          const notesWithSchema = allNotesInDomains.filter((note) => {
            return note.schema !== undefined;
          });

          // we wipe out note -> schema mapping (SchemaNotes table) since this changes every session
          // because of automatically generated schemas
          await SchemaNotesTableUtils.truncate(this._db);

          // do we actually need to filter it here?
          // is INSERT OR IGNORE more expensive than a filter?
          await Promise.all(
            notesWithSchema.map(async (note) => {
              await SchemaNotesTableUtils.insert(this._db, {
                noteId: note.id,
                ...note.schema!,
              });
            })
          );

          return allNoteIdsInDomains;
        }
      })
    );
    return schemas;
  }

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

    const getSchemaResult = SchemaNotesTableUtils.getByNoteId(
      this._db,
      key
    ).map((row) => _.omit(row, "noteId"));

    return ResultAsync.combineWithAllErrors([
      getNotePropsResult,
      getDLinksResult,
      getChildrenResult,
      getParentResult,
      getVaultResult,
      getSchemaResult,
    ]).andThen((results) => {
      // need to do this here because neverthrow doesn't know what to do
      // when the array length is over 5.
      // neverthrow caps the combine-able array size to 5 to prevent
      // infinite recursion in type inferring with no straightforward way modify the cap.
      const _results = results as [
        NotePropsTableRow,
        DLink[],
        string[],
        string | null,
        DVault,
        { schemaId: string; moduleId: string }
      ];
      const row = _results[0];

      if (!row) {
        return errAsync(new Error(`Unable to find NoteProps for id ${key}`));
      }
      const links = _results[1];
      const children = _results[2];
      const parent = _results[3];
      const vault = _results[4];
      const schema = _results[5];

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
        schema: _.isEmpty(schema) ? undefined : schema,
      };

      return okAsync(data);
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
