import {
  BacklinkUtils,
  ConsoleLogger,
  DeleteNoteResp,
  DendronASTDest,
  DendronCompositeError,
  DendronConfig,
  DendronError,
  DLink,
  DNodeUtils,
  DNoteLoc,
  DVault,
  EngineDeleteOpts,
  EngineEventEmitter,
  EngineV3Base,
  EngineWriteOptsV2,
  error2PlainObject,
  ERROR_SEVERITY,
  ERROR_STATUS,
  Event,
  EventEmitter,
  IDendronError,
  IFileStore,
  INoteStore,
  isNotUndefined,
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  NoteUtils,
  ProcFlavor,
  ReducedDEngine,
  RenameNoteOpts,
  RenameNoteResp,
  RenderNoteOpts,
  RenderNoteResp,
  RespV2,
  RespV3,
  RespWithOptError,
  stringifyError,
  TAGS_HIERARCHY,
  USERS_HIERARCHY,
  VaultUtils,
  WriteNoteResp,
} from "@dendronhq/common-all";
import _ from "lodash";
import { inject, singleton } from "tsyringe";
import { URI, Utils } from "vscode-uri";
import { NoteParserV2 } from "./NoteParserV2";
import {
  getParsingDependencyDicts,
  LinkUtils,
  MDUtilsV5,
  MDUtilsV5Web,
} from "@dendronhq/unified";

@singleton()
export class DendronEngineV3Web
  extends EngineV3Base
  implements ReducedDEngine, EngineEventEmitter
{
  private _onNoteChangedEmitter = new EventEmitter<NoteChangeEntry[]>();
  private wsRootURI: URI;

  constructor(
    @inject("wsRoot") wsRootURI: URI,
    @inject("vaults") vaults: DVault[],
    @inject("IFileStore") private fileStore: IFileStore, // TODO: Engine shouldn't be aware of FileStore. Currently still needed because of Init Logic
    @inject("INoteStore") noteStore: INoteStore<string>,
    @inject("DendronConfig")
    private dendronConfig: DendronConfig
  ) {
    super({
      logger: new ConsoleLogger(),
      noteStore,
      vaults,
      wsRoot: wsRootURI.fsPath,
    });
    this.wsRootURI = wsRootURI;
  }

  get onEngineNoteStateChanged(): Event<NoteChangeEntry[]> {
    return this._onNoteChangedEmitter.event;
  }

  dispose() {
    this._onNoteChangedEmitter.dispose();
  }

  /**
   * Does not throw error but returns it
   */
  async init(): Promise<RespV2<any>> {
    try {
      const { data: notes, error: storeError } = await this.initNotesNew(
        this.vaults
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
      const bulkWriteOpts = _.values(notes).map((note) => {
        const noteMeta: NotePropsMeta = _.omit(note, ["body"]);

        return { key: note.id, noteMeta };
      });
      this.noteStore.bulkWriteMetadata(bulkWriteOpts);

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
      const allErrors = storeError ? hookErrors.concat(storeError) : hookErrors;
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

  async renameNote(opts: RenameNoteOpts): Promise<RenameNoteResp> {
    const ctx = "DEngine:renameNote";
    const { oldLoc, newLoc } = opts;
    this.logger.info({ ctx, msg: "enter", opts });
    const oldVault = VaultUtils.getVaultByName({
      vaults: this.vaults,
      vname: oldLoc.vaultName!,
    });
    if (!oldVault) {
      return {
        error: new DendronError({
          message: "vault not found for old location",
        }),
      };
    }

    const oldNote = (
      await this.findNotes({
        fname: oldLoc.fname,
        vault: oldVault,
      })
    )[0];
    if (!oldNote) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.DOES_NOT_EXIST,
          message:
            `Unable to rename note "${
              oldLoc.fname
            }" in vault "${VaultUtils.getName(oldVault)}".` +
            ` Check that this note exists, and make sure it has a frontmatter with an id.`,
          severity: ERROR_SEVERITY.FATAL,
        }),
      };
    }
    const newNoteTitle = NoteUtils.isDefaultTitle(oldNote)
      ? NoteUtils.genTitle(newLoc.fname)
      : oldNote.title;
    // If the rename operation is changing the title and the caller did not tell us to use a special alias, calculate the alias change.
    // The aliases of links to this note will only change if they match the old note's title.
    if (newNoteTitle !== oldNote.title && !oldLoc.alias && !newLoc.alias) {
      oldLoc.alias = oldNote.title;
      newLoc.alias = newNoteTitle;
    }

    let notesChangedEntries: NoteChangeEntry[] = [];

    // Get list of notes referencing old note. We need to rename those references
    const notesReferencingOld = _.uniq(
      oldNote.links
        .filter((link) => link.type === "backlink")
        .map((link) => link.from.id)
        .filter(isNotUndefined)
    );

    const linkNotesResp = await this.noteStore.bulkGet(notesReferencingOld);

    const notesToUpdate = linkNotesResp
      .map((resp) => {
        if (resp.error) {
          this.logger.error({
            ctx,
            message: `Unable to find note linking to ${oldNote.fname}`,
            error: stringifyError(resp.error),
          });
          return undefined;
        } else {
          const note = this.processNoteChangedByRename({
            note: resp.data,
            oldLoc,
            newLoc,
            config: this.dendronConfig,
          });
          if (note && note.id === oldNote.id) {
            // If note being renamed has references to itself, make sure to update those as well
            oldNote.body = note.body;
            oldNote.tags = note.tags;
          }
          return note;
        }
      })
      .filter(isNotUndefined);

    this.logger.info({ ctx, msg: "updateAllNotes:pre" });
    const writeResp = await this.bulkWriteNotes({ notes: notesToUpdate });
    if (writeResp.error) {
      return {
        error: new DendronError({
          message: `Unable to update note link references`,
          innerError: writeResp.error,
        }),
      };
    }
    notesChangedEntries = notesChangedEntries.concat(writeResp.data);

    /**
     * If the event source is not engine(ie: vscode rename context menu), we do not want to
     * delete the original files. We just update the references on onWillRenameFiles and return.
     */
    const newNote: NoteProps = {
      ...oldNote,
      fname: newLoc.fname,
      vault: VaultUtils.getVaultByName({
        vaults: this.vaults,
        vname: newLoc.vaultName!,
      })!,
      title: newNoteTitle,
      // when renaming, we are moving a note into a completely different hierarchy.
      // we are not concerned with the children it has, so the new note
      // shouldn't inherit the old note's children.
      children: [],
    };

    // NOTE: order matters. need to delete old note, otherwise can't write new note
    this.logger.info({
      ctx,
      msg: "deleteNote:meta:pre",
      note: NoteUtils.toLogObj(oldNote),
    });

    if (
      oldNote.fname.toLowerCase() === newNote.fname.toLowerCase() &&
      VaultUtils.isEqual(oldNote.vault, newNote.vault, this.wsRoot)
    ) {
      // The file is being renamed to itself. We do this to rename a header.
      this.logger.info({ ctx, msg: "Renaming the file to same name" });

      // Add the old note's children back in
      newNote.children = oldNote.children;
    } else {
      // The file is being renamed to a new file. Delete old file first
      this.logger.info({ ctx, msg: "Renaming the file to a new name" });
      const out = await this.deleteNote(oldNote.id, {
        metaOnly: opts.metaOnly,
      });
      if (out.error) {
        return {
          error: new DendronError({
            message:
              `Unable to delete note "${
                oldNote.fname
              }" in vault "${VaultUtils.getName(oldNote.vault)}".` +
              ` Check that this note exists, and make sure it has a frontmatter with an id.`,
            severity: ERROR_SEVERITY.FATAL,
            innerError: out.error,
          }),
        };
      }
      if (out.data) {
        notesChangedEntries = notesChangedEntries.concat(out.data);
      }
    }

    this.logger.info({
      ctx,
      msg: "writeNewNote:pre",
      note: NoteUtils.toLogObj(newNote),
    });
    const out = await this.writeNote(newNote, { metaOnly: opts.metaOnly });
    if (out.error) {
      return {
        error: new DendronError({
          message: `Unable to write new renamed note for ${newNote.fname}`,
          innerError: out.error,
        }),
      };
    }
    if (out.data) {
      notesChangedEntries = notesChangedEntries.concat(out.data);
    }

    this.logger.info({ ctx, msg: "exit", opts, out: notesChangedEntries });
    return { data: notesChangedEntries };
  }

  /**
   * Update the links inside this note that need to be updated for the rename
   * from `oldLoc` to `newLoc` Will update the note in place and return note if
   * something has changed
   */
  private processNoteChangedByRename({
    note,
    oldLoc,
    newLoc,
    config,
  }: {
    note: NoteProps;
    oldLoc: DNoteLoc;
    newLoc: DNoteLoc;
    config: DendronConfig;
  }): NoteProps | undefined {
    const prevNote = _.cloneDeep(note);
    const foundLinks = LinkUtils.findLinksFromBody({
      note,
      filter: { loc: oldLoc },
      config,
    });

    // important to order by position since we replace links and this affects
    // subsequent links
    let allLinks = _.orderBy(
      foundLinks,
      (link) => {
        return link.position?.start.offset;
      },
      "desc"
    );

    // perform header updates as needed
    if (
      oldLoc.fname.toLowerCase() === newLoc.fname.toLowerCase() &&
      oldLoc.vaultName === newLoc.vaultName &&
      oldLoc.anchorHeader &&
      newLoc.anchorHeader
    ) {
      // Renaming the header, only update links that link to the old header
      allLinks = _.filter(allLinks, (link): boolean => {
        // This is a wikilink to this header
        if (link.to?.anchorHeader === oldLoc.anchorHeader) return true;
        // Or this is a range reference, and one part of the range includes this header
        return (
          link.type === "ref" &&
          isNotUndefined(oldLoc.anchorHeader) &&
          this.referenceRangeParts(link.to?.anchorHeader).includes(
            oldLoc.anchorHeader
          )
        );
      });
    }

    // filter all links for following criteria:
    // - only modify links that have same _to_ vault name
    // - explicitly same: has vault prefix
    // - implicitly same: to.vaultName is undefined, but link is in a note that's in the vault.
    allLinks = allLinks.filter((link) => {
      const oldLocVaultName = oldLoc.vaultName as string;
      const explicitlySameVault = link.to?.vaultName === oldLocVaultName;
      const oldLocVault = VaultUtils.getVaultByName({
        vaults: this.vaults,
        vname: oldLocVaultName,
      });
      const implicitlySameVault =
        _.isUndefined(link.to?.vaultName) && _.isEqual(note.vault, oldLocVault);
      return explicitlySameVault || implicitlySameVault;
    });

    // perform link substitution
    _.reduce(
      allLinks,
      (note: NoteProps, link: DLink) => {
        const oldLink = LinkUtils.dlink2DNoteLink(link);
        // current implementation adds alias for all notes
        // check if old note has alias thats different from its fname
        let alias: string | undefined;
        if (oldLink.from.alias && oldLink.from.alias !== oldLink.from.fname) {
          alias = oldLink.from.alias;
          // Update the alias if it was using the default alias.
          if (
            oldLoc.alias?.toLocaleLowerCase() ===
              oldLink.from.alias.toLocaleLowerCase() &&
            newLoc.alias
          ) {
            alias = newLoc.alias;
          }
        }
        // for hashtag links, we'll have to regenerate the alias
        if (newLoc.fname.startsWith(TAGS_HIERARCHY)) {
          const fnameWithoutTag = newLoc.fname.slice(TAGS_HIERARCHY.length);
          // Frontmatter tags don't have the hashtag
          if (link.type !== "frontmatterTag") alias = `#${fnameWithoutTag}`;
          else alias = fnameWithoutTag;
        } else if (oldLink.from.fname.startsWith(TAGS_HIERARCHY)) {
          // If this used to be a hashtag but no longer is, the alias is like `#foo.bar` and no longer makes sense.
          // And if this used to be a frontmatter tag, the alias being undefined will force it to be removed because a frontmatter tag can't point to something outside of tags hierarchy.
          alias = undefined;
        }
        // for user tag links, we'll have to regenerate the alias.
        // added link.type !==ref check because syntax like !@john doesn't work as a note ref
        if (link.type !== "ref" && newLoc.fname.startsWith(USERS_HIERARCHY)) {
          const fnameWithoutTag = newLoc.fname.slice(USERS_HIERARCHY.length);
          alias = `@${fnameWithoutTag}`;
        } else if (oldLink.from.fname.startsWith(USERS_HIERARCHY)) {
          // If this used to be a user tag but no longer is, the alias is like `@foo.bar` and no longer makes sense.
          alias = undefined;
        }
        // Correctly handle header renames in references with range based references
        if (
          oldLoc.anchorHeader &&
          link.type === "ref" &&
          isNotUndefined(oldLink.from.anchorHeader) &&
          oldLink.from.anchorHeader.indexOf(":") > -1 &&
          isNotUndefined(newLoc.anchorHeader) &&
          newLoc.anchorHeader.indexOf(":") === -1
        ) {
          // This is a reference, old anchor had a ":" in it, a new anchor header is provided and does not have ":" in it.
          // For example, `![[foo#start:#end]]` to `![[foo#something]]`. In this case, `something` is actually supposed to replace only one part of the range.
          // Find the part that matches the old header, and replace just that with the new one.
          let [start, end] = this.referenceRangeParts(
            oldLink.from.anchorHeader
          );
          if (start === oldLoc.anchorHeader) start = newLoc.anchorHeader;
          if (end === oldLoc.anchorHeader) end = newLoc.anchorHeader;
          newLoc.anchorHeader = `${start}:#${end}`;
        }
        const newBody = LinkUtils.updateLink({
          note,
          oldLink,
          newLink: {
            ...oldLink,
            from: {
              ...newLoc,
              anchorHeader: newLoc.anchorHeader || oldLink.from.anchorHeader,
              alias,
            },
          },
        });
        note.body = newBody;
        return note;
      },
      note
    );

    if (prevNote.body === note.body && prevNote.tags === note.tags) {
      return;
    } else {
      return note;
    }
  }

  private referenceRangeParts(anchorHeader?: string): string[] {
    if (!anchorHeader || anchorHeader.indexOf(":") === -1) return [];
    let [start, end] = anchorHeader.split(":");
    start = start.replace(/^#*/, "");
    end = end.replace(/^#*/, "");
    return [start, end];
  }

  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    let changes: NoteChangeEntry[] = [];
    const ctx = "DendronEngineV3Web:writeNewNote";
    this.logger.info({
      ctx,
      msg: `enter with ${opts}`,
      note: NoteUtils.toLogObj(note),
    });

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
    const resp = await this.noteStore.find({
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
        const parentResp = await this.noteStore.get(existingNote.parent);
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
          this.logger.error({
            ctx,
            msg: `Unable to find ancestor for note ${note.fname}`,
          });
          return { error: ancestorResp.error };
        }
      }
    }

    // Write to metadata store and/or filesystem
    const writeResp = opts?.metaOnly
      ? await this.noteStore.writeMetadata({ key: note.id, noteMeta: note })
      : await this.noteStore.write({ key: note.id, note });
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
    await this.updateNoteMetadataStore(changes);

    this._onNoteChangedEmitter.fire(changes);
    this.logger.info({
      ctx,
      msg: "exit",
      changed: changes.map((n) => NoteUtils.toLogObj(n.note)),
    });
    return {
      data: changes,
    };
  }

  async writeSchema() {
    throw Error("writeSchema not implemented");
  }

  async deleteNote(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<DeleteNoteResp> {
    const ctx = "DendronEngineV3Web:delete";
    const changes = await super.deleteNote(id, opts);
    if (changes.error) {
      return changes;
    }
    if (changes.data) this._onNoteChangedEmitter.fire(changes.data);

    this.logger.info({
      ctx,
      msg: "exit",
      changed: changes.data?.map((n) => NoteUtils.toLogObj(n.note)),
    });

    return changes;
  }

  private async initNotesNew(
    vaults: DVault[]
  ): Promise<RespWithOptError<NotePropsByIdDict>> {
    const ctx = "DendronEngineV3Web:initNotes";
    this.logger.info({ ctx, msg: "enter" });
    let errors: IDendronError[] = [];
    let notesFname: NotePropsByFnameDict = {};
    // const start = process.hrtime();

    const allNotesList = await Promise.all(
      vaults.map(async (vault) => {
        // Get list of files from filesystem
        const maybeFiles = await this.fileStore.readDir({
          root: Utils.joinPath(this.wsRootURI, VaultUtils.getRelPath(vault)),
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

        const { noteDicts, errors: parseErrors } = await new NoteParserV2(
          this.wsRootURI
        ).parseFiles(filteredFiles, vault);
        errors = errors.concat(parseErrors);
        if (noteDicts) {
          const { notesById, notesByFname } = noteDicts;
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
          const maybeBacklink = BacklinkUtils.createFromDLink(link);
          if (maybeBacklink) {
            const notes = NoteDictsUtils.findByFname({
              fname: link.to!.fname!,
              noteDicts,
              skipCloneDeep: true,
            });

            notes.forEach((noteTo: NoteProps) => {
              BacklinkUtils.addBacklinkInPlace({
                note: noteTo,
                backlink: maybeBacklink,
              });
            });
          }
        });
      } catch (err: any) {
        const error = error2PlainObject(err);
        this.logger.error({ error, noteFrom, message: "issue with backlinks" });
      }
    });
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
      const rootResp = await this.noteStore.find({ fname: "root", vault });
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
    const parentResp = await this.noteStore.find({ fname: dirname, vault });
    if (parentResp.data && parentResp.data.length > 0) {
      return { data: parentResp.data[0] };
    } else {
      return this.findClosestAncestor(dirname, vault);
    }
  }

  async renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp> {
    try {
      if (!opts.note) {
        throw new DendronError({ message: "note not found" });
      }
      const data = await this._renderNote({
        note: opts.note,
        flavor: opts.flavor || ProcFlavor.PREVIEW,
        dest: opts.dest || DendronASTDest.HTML,
      });
      return { data };
    } catch (error) {
      return {
        error: new DendronError({
          message: `Unable to render note ${
            opts.note!.fname
          } in ${VaultUtils.getName(opts.note!.vault)}`,
          payload: error,
        }),
      };
    }
  }

  private async _renderNote({
    note,
    flavor,
    dest,
  }: {
    note: NoteProps;
    flavor: ProcFlavor;
    dest: DendronASTDest;
  }): Promise<string> {
    const noteCacheForRenderDict = await getParsingDependencyDicts(
      note,
      this,
      this.dendronConfig,
      this.vaults
    );

    // Also include children to render the 'children' hierarchy at the footer of the page:
    await Promise.all(
      note.children.map(async (childId) => {
        // TODO: Can we use a bulk get API instead (if/when it exists) to speed
        // up fetching time
        const childNote = await this.getNote(childId);

        if (childNote.data) {
          NoteDictsUtils.add(childNote.data, noteCacheForRenderDict);
        }
      })
    );

    let proc: ReturnType<typeof MDUtilsV5["procRehypeFull"]>;
    if (dest === DendronASTDest.HTML) {
      proc = MDUtilsV5Web.procRehypeWeb(
        {
          noteToRender: note,
          fname: note.fname,
          vault: note.vault,
          config: this.dendronConfig,
          noteCacheForRenderDict,
        },
        { flavor }
      );
    } else {
      // Only support Preview rendering right now:
      return "Only HTML Rendering is supported right now.";
    }

    const serialized = NoteUtils.serialize(note);
    const payload = await proc.process(serialized);

    const renderedNote = payload.toString();
    return renderedNote;
  }
}
