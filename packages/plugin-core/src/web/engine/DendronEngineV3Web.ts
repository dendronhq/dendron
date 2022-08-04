import {
  BulkResp,
  DendronCompositeError,
  DendronError,
  DEngineDeleteSchemaResp,
  DNodeUtils,
  DVault,
  DVaultUriVariant,
  EngineDeleteNoteResp,
  EngineWriteOptsV2,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  FuseEngine,
  IDendronError,
  IFileStore,
  INoteStore,
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  NoteUtils,
  QueryNotesOpts,
  RenameNotePayload,
  RespV2,
  RespV3,
  SchemaModuleProps,
  SchemaQueryResp,
  VaultUtils,
  WriteNoteResp,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, singleton } from "tsyringe";
import { IReducedEngineAPIService } from "./IReducedEngineApiService";
import { NoteParserV2 } from "./NoteParserV2";

@singleton()
export class DendronEngineV3Web implements IReducedEngineAPIService {
  private fuseEngine: FuseEngine;
  private _vaults: DVaultUriVariant[];
  private _noteStore: INoteStore<string>;
  private _fileStore: IFileStore;

  constructor(
    @inject("vaults") vaults: DVaultUriVariant[],
    @inject("IFileStore") fileStore: IFileStore, // TODO: Engine shouldn't be aware of FileStore. Currently still needed because of Init Logic
    @inject("INoteStore") noteStore: INoteStore<string>
  ) {
    this.fuseEngine = new FuseEngine({
      fuzzThreshold: 0.2, // TODO: Pull from config: ConfigUtils.getLookup(props.config).note.fuzzThreshold,
    });
    this._vaults = vaults;
    this._noteStore = noteStore;
    this._fileStore = fileStore;
  }

  /**
   * Does not throw error but returns it
   */
  async init(): Promise<RespV2<any>> {
    // async init(): Promise<DEngineInitResp> {
    try {
      const { data: notes, error: storeError } = await this.initNotesNew(
        this._vaults
      );

      // TODO: add schemas to notes

      if (_.isUndefined(notes)) {
        return {
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.UNKNOWN,
            severity: ERROR_SEVERITY.FATAL,
          }),
        };
      }
      this.fuseEngine.replaceNotesIndex(notes);
      const bulkWriteOpts = _.values(notes).map((note) => {
        const noteMeta: NotePropsMeta = _.omit(note, ["body", "contentHash"]);

        return { key: note.id, noteMeta };
      });
      this._noteStore.bulkWriteMetadata(bulkWriteOpts);

      // TODO: update schema index
      //this.updateIndex("schema");
      const hookErrors: IDendronError[] = [];
      // this.hooks.onCreate = this.hooks.onCreate.filter((hook) => {
      //   const { valid, error } = HookUtils.validateHook({
      //     hook,
      //     wsRoot: this.wsRoot,
      //   });
      //   if (!valid && error) {
      //     this.logger.error({ msg: "bad hook", hook, error });
      //     hookErrors.push(error);
      //   }
      //   return valid;
      // });
      const allErrors = storeError
        ? hookErrors.concat(storeError.errors)
        : hookErrors;
      let error: IDendronError | null;
      switch (_.size(allErrors)) {
        case 0: {
          error = null;
          break;
        }
        case 1: {
          error = new DendronError(allErrors[0]);
          break;
        }
        default:
          error = new DendronCompositeError(allErrors);
      }
      // this.logger.info({ ctx: "init:ext", error, storeError, hookErrors });
      return { error };
    } catch (error: any) {
      const { message, stack, status } = error;
      const payload = { message, stack };
      return {
        error: DendronError.createPlainError({
          payload,
          message,
          status,
          severity: ERROR_SEVERITY.FATAL,
        }),
      };
    }
  }

  /**
   * See {@link DEngine.getNote}
   */
  async getNote(id: string): Promise<NoteProps | undefined> {
    const resp = await this._noteStore.get(id);
    return resp.data;
  }

  /**
   * See {@link DEngine.findNotes}
   */
  async findNotes(opts: FindNoteOpts): Promise<NoteProps[]> {
    const resp = await this._noteStore.find(opts);
    return resp.data ? resp.data : [];
  }

  /**
   * See {@link DEngine.findNotesMeta}
   */
  async findNotesMeta(opts: FindNoteOpts): Promise<NotePropsMeta[]> {
    const resp = await this._noteStore.findMetaData(opts);
    return resp.data ? resp.data : [];
  }

  async bulkWriteNotes(): Promise<Required<BulkResp<NoteChangeEntry[]>>> {
    throw new Error("bulkWriteNotes not implemented");
  }

  async deleteNote(): Promise<EngineDeleteNoteResp> {
    throw Error("deleteNote not implemented");
  }

  async deleteSchema(): Promise<DEngineDeleteSchemaResp> {
    throw Error("deleteSchema not implemented");
  }

  async getSchema(): Promise<RespV2<SchemaModuleProps>> {
    throw Error("getSchema not implemented");
  }

  async querySchema(): Promise<SchemaQueryResp> {
    throw Error("querySchema not implemented");
  }

  async queryNotes(opts: QueryNotesOpts): Promise<RespV2<NoteProps[]>> {
    // const ctx = "Engine:queryNotes";
    const { qs, vault, onlyDirectChildren, originalQS } = opts;

    // Need to ignore this because the engine stringifies this property, so the types are incorrect.
    // @ts-ignore
    if (vault?.selfContained === "true" || vault?.selfContained === "false")
      vault.selfContained = vault.selfContained === "true";

    const items = await this.fuseEngine.queryNote({
      qs,
      onlyDirectChildren,
      originalQS,
    });

    if (items.length === 0) {
      return { error: null, data: [] };
    }

    const notes = await Promise.all(
      items.map((ent) => this._noteStore.get(ent.id)) // TODO: Should be using metadata instead
    );

    let modifiedNotes;
    // let notes = items.map((ent) => this.notes[ent.id]);
    // if (!_.isUndefined(vault)) {
    modifiedNotes = notes
      .filter((ent) => _.isUndefined(ent.error))
      .map((resp) => resp.data!);

    if (!_.isUndefined(vault)) {
      modifiedNotes = modifiedNotes.filter((ent) =>
        VaultUtils.isEqualV2(vault, ent.data!.vault)
      );
    }

    return {
      error: null,
      // data: items,
      data: modifiedNotes,
    };
  }

  async renameNote(): Promise<RespV2<RenameNotePayload>> {
    throw Error("renameNote not implemented");
  }

  async updateSchema() {
    throw Error("updateSchema not implemented");
  }

  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    let changes: NoteChangeEntry[] = [];
    const error: DendronError | null = null;
    // this.logger.info({
    //   ctx,
    //   msg: `enter with ${opts}`,
    //   note: NoteUtils.toLogObj(note),
    // });

    // // Apply hooks
    // if (opts?.runHooks === false) {
    //   this.logger.info({
    //     ctx,
    //     msg: "hooks disabled for write",
    //   });
    // } else {
    //   const hooks = _.filter(this.hooks.onCreate, (hook) =>
    //     NoteUtils.match({ notePath: note.fname, pattern: hook.pattern })
    //   );
    //   const resp = await _.reduce<DHookEntry, Promise<RequireHookResp>>(
    //     hooks,
    //     async (notePromise, hook) => {
    //       const { note } = await notePromise;
    //       const script = HookUtils.getHookScriptPath({
    //         wsRoot: this.wsRoot,
    //         basename: hook.id + ".js",
    //       });
    //       return HookUtils.requireHook({
    //         note,
    //         fpath: script,
    //         wsRoot: this.wsRoot,
    //       });
    //     },
    //     Promise.resolve({ note })
    //   ).catch(
    //     (err) =>
    //       new DendronError({
    //         severity: ERROR_SEVERITY.MINOR,
    //         message: "error with hook",
    //         payload: stringifyError(err),
    //       })
    //   );
    //   if (resp instanceof DendronError) {
    //     error = resp;
    //     this.logger.error({ ctx, error: stringifyError(error) });
    //   } else {
    //     const valResp = NoteUtils.validate(resp.note);
    //     if (valResp instanceof DendronError) {
    //       error = valResp;
    //       this.logger.error({ ctx, error: stringifyError(error) });
    //     } else {
    //       note = resp.note;
    //       this.logger.info({ ctx, msg: "fin:RunHooks", payload: resp.payload });
    //     }
    //   }
    // }

    // Check if another note with same fname and vault exists
    const resp = await this._noteStore.find({
      fname: note.fname,
      vault: note.vault,
    });
    const existingNote = resp.data ? resp.data[0] : undefined;
    // If a note exists with a different id but same fname/vault, then we throw an error unless its a stub or override is set
    if (existingNote && existingNote.id !== note.id) {
      // If note is a stub or client wants to override existing note, we need to update parent/children relationships since ids are different
      // The parent of this note needs to have the old note removed (because the id is now different)
      // The new note needs to have the old note's children
      if (existingNote.stub || opts?.overrideExisting) {
        // make sure existing note actually has a parent.
        if (!existingNote.parent) {
          // TODO: We should be able to handle rewriting of root. This happens
          // with certain operations such as Doctor FixFrontmatter
          return {
            error: new DendronError({
              status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
              message: `No parent found for ${existingNote.fname}`,
            }),
          };
        }
        const parentResp = await this._noteStore.get(existingNote.parent);
        if (parentResp.error) {
          return {
            error: new DendronError({
              status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
              message: `No parent found for ${existingNote.fname}`,
              innerError: parentResp.error,
            }),
          };
        }

        // Save the state of the parent to later record changed entry.
        const parent = parentResp.data;
        const prevParentState = { ...parent };

        // Update existing note's parent so that it doesn't hold the existing note's id as children
        DNodeUtils.removeChild(parent, existingNote);

        // Update parent note of existing note so that the newly created note is a child
        DNodeUtils.addChild(parent, note);

        // Add an entry for the updated parent
        changes.push({
          prevNote: prevParentState,
          note: parent,
          status: "update",
        });

        // Move children to new note
        changes = changes.concat(
          await this.updateChildrenWithNewParent(existingNote, note)
        );

        // Delete the existing note from metadata store. Since fname/vault are the same, no need to touch filesystem
        changes.push({ note: existingNote, status: "delete" });
        changes.push({ note, status: "create" });
      } else {
        return {
          error: new DendronError({
            message: `Cannot write note with id ${note.id}. Note ${existingNote.id} with same fname and vault exists`,
          }),
        };
      }
    } else if (existingNote && existingNote.id === note.id) {
      // If a note exist with the same id, then we treat this as an update
      changes.push({ prevNote: existingNote, note, status: "update" });
    } else {
      // If no note exists, then we treat this as a create
      changes.push({ note, status: "create" });

      // If existing note does not exist, check if we need to add parents
      // eg. if user created `baz.one.two` and neither `baz` or `baz.one` exist, then they need to be created
      // this is the default behavior
      if (!opts?.noAddParent) {
        const ancestorResp = await this.findClosestAncestor(
          note.fname,
          note.vault
        );
        if (ancestorResp.data) {
          const ancestor = ancestorResp.data;

          const prevAncestorState = { ...ancestor };

          // Create stubs for any uncreated notes between ancestor and note
          const stubNodes = NoteUtils.createStubs(ancestor, note);
          stubNodes.forEach((stub) => {
            changes.push({
              status: "create",
              note: stub,
            });
          });

          changes.push({
            status: "update",
            prevNote: prevAncestorState,
            note: ancestor,
          });
        } else {
          // this.logger.error({
          //   ctx,
          //   msg: `Unable to find ancestor for note ${note.fname}`,
          // });
          return { error: ancestorResp.error };
        }
      }
    }

    // Write to metadata store and/or filesystem
    const writeResp = opts?.metaOnly
      ? await this._noteStore.writeMetadata({ key: note.id, noteMeta: note })
      : await this._noteStore.write({ key: note.id, note });
    if (writeResp.error) {
      return {
        error: new DendronError({
          message: `Unable to write note ${note.id}`,
          severity: ERROR_SEVERITY.MINOR,
          payload: writeResp.error,
        }),
      };
    }

    // TODO: Add schema

    // Propragate metadata for all other changes
    await this.fuseEngine.updateNotesIndex(changes);
    await this.updateNoteMetadataStore(changes);

    // this.logger.info({
    //   ctx,
    //   msg: "exit",
    //   changed: changes.map((n) => NoteUtils.toLogObj(n.note)),
    // });
    return {
      error,
      data: changes,
    };
  }

  async writeSchema() {
    throw Error("writeSchema not implemented");
  }

  private async initNotesNew(
    vaults: DVaultUriVariant[]
  ): Promise<BulkResp<NotePropsByIdDict>> {
    // const ctx = "DendronEngineV3:initNotes";
    // this.logger.info({ ctx, msg: "enter" });
    let errors: IDendronError[] = [];
    let notesFname: NotePropsByFnameDict = {};
    // const start = process.hrtime();

    const allNotesList = await Promise.all(
      vaults.map(async (vault) => {
        // Get list of files from filesystem
        const maybeFiles = await this._fileStore.readDir({
          root: VaultUtils.getRelPathUriVariant(vault),
          include: ["*.md"],
        });

        if (maybeFiles.error) {
          // Keep initializing other vaults
          errors = errors.concat([
            new DendronError({
              message: `Unable to read notes for vault ${vault.name}`,
              severity: ERROR_SEVERITY.MINOR,
              payload: maybeFiles.error,
            }),
          ]);
          return {};
        }

        // TODO: Remove once this works inside file store.
        const filteredFiles = maybeFiles.data.filter((file) =>
          file.endsWith(".md")
        );

        // // Load cache from vault
        // const cachePath = path.join(vpath, CONSTANTS.DENDRON_CACHE_FILE);
        // const notesCache = new NotesFileSystemCache({
        //   cachePath,
        //   noCaching: this.config.noCaching,
        //   logger: this.logger,
        // });

        // TODO: Currently mocked as empty
        // const notesDict: NoteDicts = {
        //   notesById: {},
        //   notesByFname: {},
        // };

        const { data: notesDict, error } = await new NoteParserV2().parseFiles(
          filteredFiles,
          vault
        );
        if (error) {
          errors = errors.concat(error?.errors);
        }
        if (notesDict) {
          const { notesById, notesByFname } = notesDict;
          notesFname = NoteFnameDictUtils.merge(notesFname, notesByFname);

          // this.logger.info({
          //   ctx,
          //   vault,
          //   numEntries: _.size(notesById),
          //   numCacheUpdates: notesCache.numCacheMisses,
          // });
          return notesById;
        }
        return {};
      })
    );
    const allNotes: NotePropsByIdDict = Object.assign({}, ...allNotesList);
    const notesWithLinks = _.filter(allNotes, (note) => !_.isEmpty(note.links));
    this.addBacklinks(
      {
        notesById: allNotes,
        notesByFname: notesFname,
      },
      notesWithLinks
    );
    // const duration = getDurationMilliseconds(start);
    // this.logger.info({ ctx, msg: `time to init notes: "${duration}" ms` });

    return {
      data: allNotes,
      error: new DendronCompositeError(errors),
    };
  }

  /**
   * Create and add backlinks from all notes with a link pointing to another note
   */
  private addBacklinks(noteDicts: NoteDicts, notesWithLinks: NoteProps[]) {
    notesWithLinks.forEach((noteFrom) => {
      try {
        noteFrom.links.forEach((link) => {
          const fname = link.to?.fname;
          // Note referencing itself does not count as backlink
          if (fname && fname !== noteFrom.fname) {
            const notes = NoteDictsUtils.findByFname(fname, noteDicts);

            notes.forEach((noteTo: NoteProps) => {
              NoteUtils.addBacklink({
                from: noteFrom,
                to: noteTo,
                link,
              });
            });
          }
        });
      } catch (err: any) {
        // const error = error2PlainObject(err);
        // this.logger.error({ error, noteFrom, message: "issue with backlinks" });
      }
    });
  }

  /**
   * Move children of old parent note to new parent
   * @return note change entries of modified children
   */
  private async updateChildrenWithNewParent(
    oldParent: NotePropsMeta,
    newParent: NotePropsMeta
  ) {
    const changes: NoteChangeEntry[] = [];
    // Move existing note's children to new note
    const childrenResp = await this._noteStore.bulkGet(oldParent.children);
    childrenResp.forEach((child) => {
      if (child.data) {
        const childNote = child.data;
        const prevChildNoteState = { ...childNote };
        DNodeUtils.addChild(newParent, childNote);

        // Add one entry for each child updated
        changes.push({
          prevNote: prevChildNoteState,
          note: childNote,
          status: "update",
        });
      }
    });
    return changes;
  }

  /**
   * Update note metadata store based on note change entries
   * @param changes entries to update
   * @returns
   */
  private async updateNoteMetadataStore(
    changes: NoteChangeEntry[]
  ): Promise<RespV3<string>[]> {
    return Promise.all(
      changes.map((change) => {
        switch (change.status) {
          case "delete": {
            return this._noteStore.deleteMetadata(change.note.id);
          }
          case "create":
          case "update": {
            return this._noteStore.writeMetadata({
              key: change.note.id,
              noteMeta: change.note,
            });
          }
          default:
            return { data: "" };
        }
      })
    );
  }

  /**
   * Recursively search through fname to find next available ancestor note.
   *
   * E.g, if fpath = "baz.foo.bar", search for "baz.foo", then "baz", then "root" until first valid note is found
   * @param fpath of note to find ancestor of
   * @param vault of ancestor note
   * @returns closest ancestor note
   */
  private async findClosestAncestor(
    fpath: string,
    vault: DVault
  ): Promise<RespV3<NoteProps>> {
    const dirname = DNodeUtils.dirName(fpath);
    // Reached the end, must be root note
    if (dirname === "") {
      const rootResp = await this._noteStore.find({ fname: "root", vault });
      if (rootResp.error || rootResp.data.length === 0) {
        return {
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.NO_ROOT_NOTE_FOUND,
            message: `No root found for ${fpath}.`,
            innerError: rootResp.error,
            severity: ERROR_SEVERITY.MINOR,
          }),
        };
      }
      return { data: rootResp.data[0] };
    }
    const parentResp = await this._noteStore.find({ fname: dirname, vault });
    if (parentResp.data && parentResp.data.length > 0) {
      return { data: parentResp.data[0] };
    } else {
      return this.findClosestAncestor(dirname, vault);
    }
  }
}
