import {
  BacklinkUtils,
  Cache,
  ConfigService,
  ConfigUtils,
  CONSTANTS,
  DeleteSchemaResp,
  DendronASTDest,
  DendronCompositeError,
  DendronConfig,
  DendronError,
  DEngine,
  DEngineClient,
  DEngineInitResp,
  DHookDict,
  DHookEntry,
  DLink,
  DLinkUtils,
  DNodeUtils,
  DNoteLoc,
  DVault,
  EngineDeleteOpts,
  EngineInfoResp,
  EngineSchemaWriteOpts,
  EngineV3Base,
  EngineWriteOptsV2,
  error2PlainObject,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FuseEngine,
  GetDecorationsOpts,
  GetDecorationsResp,
  GetNoteBlocksOpts,
  GetNoteBlocksResp,
  GetSchemaResp,
  IDendronError,
  IFileStore,
  INoteStore,
  ISchemaStore,
  isNotUndefined,
  LruCache,
  milliseconds,
  newRange,
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteMetadataStore,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  NoteStore,
  NoteUtils,
  NullCache,
  ProcFlavor,
  QuerySchemaResp,
  RenameNoteOpts,
  RenameNoteResp,
  RenderNoteOpts,
  RenderNoteResp,
  RespV3,
  RespWithOptError,
  SchemaMetadataStore,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaStore,
  SchemaUtils,
  stringifyError,
  TAGS_HIERARCHY,
  URI,
  USERS_HIERARCHY,
  VaultUtils,
  WorkspaceOpts,
  WriteNoteResp,
  WriteSchemaResp,
} from "@dendronhq/common-all";
import {
  createLogger,
  DLogger,
  getDurationMilliseconds,
  NodeJSUtils,
  vault2Path,
} from "@dendronhq/common-server";
import {
  getParsingDependencyDicts,
  LinkUtils,
  MDUtilsV5,
  RemarkUtils,
  runAllDecorators,
} from "@dendronhq/unified";
import _ from "lodash";
import path from "path";
import { NotesFileSystemCache } from "./cache/notesFileSystemCache";
import { NoteParserV2 } from "./drivers/file/NoteParserV2";
import { SchemaParser } from "./drivers/file/schemaParser";
import { NodeJSFileStore } from "./store";
import { HookUtils, RequireHookResp } from "./topics/hooks";
import { EngineUtils } from "./utils/engineUtils";

type DendronEngineOptsV3 = {
  wsRoot: string;
  vaults: DVault[];
  fileStore: IFileStore;
  noteStore: INoteStore<string>;
  schemaStore: ISchemaStore<string>;
  logger: DLogger;
  config: DendronConfig;
};

type CachedPreview = {
  data: string;
  updated: number;
  contentHash?: string;
};

export class DendronEngineV3 extends EngineV3Base implements DEngine {
  public wsRoot: string;
  public hooks: DHookDict;
  private _fileStore: IFileStore;
  private _noteStore: INoteStore<string>;
  private _schemaStore: ISchemaStore<string>;
  private _renderedCache: Cache<string, CachedPreview>;

  constructor(props: DendronEngineOptsV3) {
    super(props);
    this.wsRoot = props.wsRoot;
    const hooks: DHookDict = ConfigUtils.getWorkspace(props.config).hooks || {
      onCreate: [],
    };
    this.hooks = hooks;
    this._renderedCache = this.createRenderedCache(props.config);
    this._fileStore = props.fileStore;
    this._noteStore = props.noteStore;
    this._schemaStore = props.schemaStore;
  }

  static async create({
    wsRoot,
    logger,
  }: {
    logger?: DLogger;
    wsRoot: string;
  }) {
    const LOGGER = logger || createLogger();
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;

    const fileStore = new NodeJSFileStore();
    const fuseEngine = new FuseEngine({
      fuzzThreshold: ConfigUtils.getLookup(config).note.fuzzThreshold,
    });

    return new DendronEngineV3({
      wsRoot,
      vaults: ConfigUtils.getVaults(config),
      noteStore: new NoteStore(
        fileStore,
        new NoteMetadataStore(fuseEngine),
        URI.file(wsRoot)
      ),
      schemaStore: new SchemaStore(
        fileStore,
        new SchemaMetadataStore(fuseEngine),
        URI.parse(wsRoot)
      ),
      fileStore,
      logger: LOGGER,
      config,
    });
  }

  /**
   * Does not throw error but returns it
   */
  async init(): Promise<DEngineInitResp> {
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(this.wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;
    const defaultResp = {
      notes: {},
      schemas: {},
      wsRoot: this.wsRoot,
      vaults: this.vaults,
      config,
    };
    try {
      const { data: schemas, error: schemaErrors } = await this.initSchema();
      if (_.isUndefined(schemas)) {
        return {
          data: defaultResp,
          error: DendronError.createFromStatus({
            message: "No schemas found",
            status: ERROR_STATUS.UNKNOWN,
            severity: ERROR_SEVERITY.FATAL,
          }),
        };
      }
      const schemaDict: SchemaModuleDict = {};
      schemas.forEach((schema) => {
        // TODO: what if there are duplicate schema.root.id
        schemaDict[schema.root.id] = schema;
      });

      // Write schema data prior to initializing notes, so that the schema
      // information can correctly get applied to the notes.
      const bulkWriteSchemaOpts = schemas.map((schema) => {
        return { key: schema.root.id, schema };
      });
      this._schemaStore.dispose();
      this._schemaStore.bulkWriteMetadata(bulkWriteSchemaOpts);

      const { data: noteDicts, error: noteErrors } = await this.initNotes(
        schemaDict
      );
      const { notesById } = noteDicts;
      if (_.isUndefined(notesById)) {
        return {
          data: defaultResp,
          error: DendronError.createFromStatus({
            message: "No notes found",
            status: ERROR_STATUS.UNKNOWN,
            severity: ERROR_SEVERITY.FATAL,
          }),
        };
      }

      // Backlink candidates have to be done after notes are initialized because it depends on the engine already having notes in it
      if (config.dev?.enableLinkCandidates) {
        const ctx = "_addLinkCandidates";
        const start = process.hrtime();
        this.logger.info({ ctx, msg: "pre:addLinkCandidates" });
        // Mutates existing note objects so we don't need to reset the notes
        const maxNoteLength = ConfigUtils.getWorkspace(config).maxNoteLength;
        this.updateNotesWithLinkCandidates(noteDicts, maxNoteLength, config);
        const duration = getDurationMilliseconds(start);
        this.logger.info({ ctx, duration });
      }

      const bulkWriteOpts = _.values(notesById).map((note) => {
        const noteMeta: NotePropsMeta = _.omit(note, ["body"]);

        return { key: note.id, noteMeta };
      });
      this._noteStore.dispose();
      this._noteStore.bulkWriteMetadata(bulkWriteOpts);

      const hookErrors: IDendronError[] = [];
      this.hooks.onCreate = this.hooks.onCreate.filter((hook) => {
        const { valid, error } = HookUtils.validateHook({
          hook,
          wsRoot: this.wsRoot,
        });
        if (!valid && error) {
          this.logger.error({ msg: "bad hook", hook, error });
          hookErrors.push(error);
        }
        return valid;
      });
      let allErrors = noteErrors ? hookErrors.concat(noteErrors) : hookErrors;
      allErrors = schemaErrors ? allErrors.concat(schemaErrors) : allErrors;
      let error: IDendronError | undefined;
      switch (_.size(allErrors)) {
        case 0: {
          break;
        }
        case 1: {
          error = new DendronError(allErrors[0]);
          break;
        }
        default:
          error = new DendronCompositeError(allErrors);
      }
      this.logger.info({
        ctx: "init:ext",
        error,
        storeError: allErrors,
        hookErrors,
      });
      return {
        error,
        data: {
          notes: notesById,
          wsRoot: this.wsRoot,
          vaults: this.vaults,
          config,
        },
      };
    } catch (error: any) {
      const { message, stack, status } = error;
      const payload = { message, stack };
      return {
        data: defaultResp,
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
   * See {@link DEngine.writeNote}
   */
  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    let changes: NoteChangeEntry[] = [];
    const ctx = "DEngine:writeNewNote";
    this.logger.info({
      ctx,
      msg: `enter with ${opts}`,
      note: NoteUtils.toLogObj(note),
    });

    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(this.wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;
    // Update links/anchors based on note body
    await EngineUtils.refreshNoteLinksAndAnchors({
      note,
      engine: this,
      config,
    });

    // Apply hooks
    if (opts?.runHooks === false) {
      this.logger.info({
        ctx,
        msg: "hooks disabled for write",
      });
    } else {
      const hooks = _.filter(this.hooks.onCreate, (hook) =>
        NoteUtils.match({ notePath: note.fname, pattern: hook.pattern })
      );
      const resp = await _.reduce<DHookEntry, Promise<RequireHookResp>>(
        hooks,
        async (notePromise, hook) => {
          const { note } = await notePromise;
          const script = HookUtils.getHookScriptPath({
            wsRoot: this.wsRoot,
            basename: hook.id + ".js",
          });
          return HookUtils.requireHook({
            note,
            fpath: script,
            wsRoot: this.wsRoot,
          });
        },
        Promise.resolve({ note })
      ).catch(
        (err) =>
          new DendronError({
            severity: ERROR_SEVERITY.MINOR,
            message: "error with hook",
            payload: stringifyError(err),
          })
      );
      if (resp instanceof DendronError) {
        this.logger.error({ ctx, error: stringifyError(resp) });
        return { error: resp };
      } else {
        const valResp = NoteUtils.validate(resp.note);
        if (valResp.error) {
          this.logger.error({ ctx, error: stringifyError(valResp.error) });
          return { error: valResp.error };
        } else {
          note = resp.note;
          this.logger.info({ ctx, msg: "fin:RunHooks", payload: resp.payload });
        }
      }
    }

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
      } else {
        return {
          error: new DendronError({
            message: `Cannot write note with id ${note.id}. Note ${existingNote.id} with same fname and vault exists`,
          }),
        };
      }
    } else if (!existingNote && !opts?.noAddParent) {
      // If existing note does not exist, check if we need to add parents
      // eg. if user created `baz.one.two` and neither `baz` or `baz.one` exist, then they need to be created
      // this is the default behavior
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

    // Add schema if this is a new note
    if (existingNote) {
      note.schema = existingNote.schema;
    } else {
      const domainName = DNodeUtils.domainName(note.fname);
      const maybeSchemaModule = await this._schemaStore.getMetadata(domainName);
      if (maybeSchemaModule.data) {
        const schemaMatch = SchemaUtils.findSchemaFromModule({
          notePath: note.fname,
          schemaModule: maybeSchemaModule.data,
        });
        if (schemaMatch) {
          this.logger.info({
            ctx,
            msg: "pre:addSchema",
          });
          const { schema, schemaModule } = schemaMatch;
          NoteUtils.addSchema({ note, schema, schemaModule });
        }
      }
    }

    // If a note exist with the same id, then we treat this as an update
    if (existingNote && existingNote.id === note.id) {
      /**
       * Calculate diff of links with the `to` prop that have changed.
       * For links that have been removed, delete those backlinks from the toNotes.
       * For links that have been added, create backlinks for the toNotes
       */
      const deletedLinks = existingNote.links.filter(
        (link) =>
          link.to?.fname &&
          !note.links.some((linkToCompare) =>
            DLinkUtils.isEquivalent(link, linkToCompare)
          )
      );
      const addedLinks = note.links.filter(
        (link) =>
          link.to?.fname &&
          !existingNote.links.some((linkToCompare) =>
            DLinkUtils.isEquivalent(link, linkToCompare)
          )
      );

      const addedChanges = await Promise.all(
        addedLinks.map((link) => {
          return this.addBacklink(link);
        })
      );

      const removedChanges = await Promise.all(
        deletedLinks.map((link) => {
          return this.removeBacklink(link);
        })
      );
      changes = changes.concat(addedChanges.flat());
      changes = changes.concat(removedChanges.flat());
      changes.push({ prevNote: existingNote, note, status: "update" });
    } else {
      // If this is a new note, add backlinks if applicable to referenced notes
      const backlinkChanges = await Promise.all(
        note.links.map((link) => this.addBacklink(link))
      );
      changes = changes.concat(backlinkChanges.flat());
      changes.push({ note, status: "create" });
    }

    // Propragate metadata for all other changes
    await this.updateNoteMetadataStore(changes);

    this.logger.info({
      ctx,
      msg: "exit",
      changed: changes.map((n) => NoteUtils.toLogObj(n.note)),
    });
    return {
      data: changes,
    };
  }

  /**
   * See {@link DEngine.renameNote}
   *
   * TODO: make atomic
   */
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

    const linkNotesResp = await this._noteStore.bulkGet(notesReferencingOld);

    // update note body of all notes that have changed
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(this.wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;
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
            config,
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
   * See {@link DEngine.getSchema}
   */
  async getSchema(id: string): Promise<GetSchemaResp> {
    return this._schemaStore.getMetadata(id);
  }

  /**
   * See {@link DEngine.writeSchema}
   */
  async writeSchema(
    schema: SchemaModuleProps,
    opts?: EngineSchemaWriteOpts
  ): Promise<WriteSchemaResp> {
    const resp = opts?.metaOnly
      ? await this._schemaStore.writeMetadata({ key: schema.root.id, schema })
      : await this._schemaStore.write({ key: schema.root.id, schema });

    if (resp.error) {
      return { error: resp.error };
    }
    return { data: undefined };
  }

  /**
   * See {@link DEngine.deleteSchema}
   */
  async deleteSchema(
    id: string,
    opts?: EngineDeleteOpts
  ): Promise<DeleteSchemaResp> {
    if (opts?.metaOnly) {
      await this._schemaStore.deleteMetadata(id);
    } else {
      await this._schemaStore.delete(id);
    }
    // TODO Sqlite : rework this to make more efficient - shouldn't need to
    // re-init after a schema delete.
    return this.init();
  }

  async info(): Promise<EngineInfoResp> {
    const version = NodeJSUtils.getVersionFromPkg();
    if (!version) {
      return {
        error: DendronError.createPlainError({
          message: "Unable to read Dendron version",
        }),
      };
    }
    return {
      data: {
        version,
      },
    };
  }

  /**
   * See {@link DEngine.querySchema}
   */
  async querySchema(queryString: string): Promise<QuerySchemaResp> {
    const ctx = "DEngine:querySchema";

    const schemas = await this._schemaStore.queryMetadata({
      qs: queryString,
    });
    if (schemas.isErr()) {
      return { error: schemas.error };
    }
    this.logger.info({ ctx, msg: "exit" });
    return {
      data: schemas.value,
    };
  }

  async renderNote({
    id,
    note,
    flavor,
    dest,
  }: RenderNoteOpts): Promise<RenderNoteResp> {
    const ctx = "DEngine:renderNote";

    // If provided, we render the given note entirely. Otherwise find the note in workspace.
    if (!note) {
      note = (await this.getNote(id)).data;
    }
    // If note was not provided and we couldn't find it, we can't render.
    if (!note) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `${id} does not exist`,
        }),
      };
    }

    const cachedPreview = this._renderedCache.get(id);
    if (cachedPreview) {
      if (await this.isCachedPreviewUpToDate(cachedPreview, note)) {
        this.logger.info({ ctx, id, msg: `Will use cached rendered preview.` });

        // Cached preview updated time is the same as note.updated time.
        // Hence we can skip re-rendering and return the cached version of preview.
        return { data: cachedPreview.data };
      }
    }

    this.logger.info({
      ctx,
      id,
      msg: `Did not find usable cached rendered preview. Starting to render.`,
    });

    const beforeRenderMillis = milliseconds();

    // Either we don't have have the cached preview or the version that is
    // cached has gotten stale, hence we will re-render the note and cache
    // the new value.
    let data: string;
    try {
      data = await this._renderNote({
        note,
        flavor: flavor || ProcFlavor.PREVIEW,
        dest: dest || DendronASTDest.HTML,
      });
    } catch (error) {
      return {
        error: new DendronError({
          message: `Unable to render note ${note.fname} in ${VaultUtils.getName(
            note.vault
          )}`,
          payload: error,
        }),
      };
    }

    this._renderedCache.set(id, {
      updated: note.updated,
      contentHash: note.contentHash,
      data,
    });

    const duration = milliseconds() - beforeRenderMillis;
    this.logger.info({ ctx, id, duration, msg: `Render preview finished.` });

    if (NoteUtils.isFileId(note.id)) {
      // Dummy note, we should remove it once we're done rendering
      await this.deleteNote(note.id, { metaOnly: true });
    }

    return { data };
  }

  async getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksResp> {
    const note = (await this.getNote(opts.id)).data;
    try {
      if (_.isUndefined(note)) {
        return {
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.INVALID_STATE,
            message: `${opts.id} does not exist`,
          }),
        };
      }
      const configReadResult = await ConfigService.instance().readConfig(
        URI.file(this.wsRoot)
      );
      if (configReadResult.isErr()) {
        throw configReadResult.error;
      }
      const config = configReadResult.value;
      const blocks = await RemarkUtils.extractBlocks({
        note,
        config,
      });
      if (opts.filterByAnchorType) {
        _.remove(
          blocks,
          (block) => block.anchor?.type !== opts.filterByAnchorType
        );
      }
      return { data: blocks };
    } catch (err: any) {
      return {
        error: err,
      };
    }
  }

  async getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsResp> {
    const note = (await this.getNote(opts.id)).data;
    try {
      if (_.isUndefined(note)) {
        return {
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.INVALID_STATE,
            message: `${opts.id} does not exist`,
          }),
          data: {},
        };
      }
      // Very weirdly, these range numbers turn into strings when getting called in through the API.
      // Not sure if I'm missing something.
      opts.ranges = opts.ranges.map((item) => {
        return {
          text: item.text,
          range: newRange(
            _.toNumber(item.range.start.line),
            _.toNumber(item.range.start.character),
            _.toNumber(item.range.end.line),
            _.toNumber(item.range.end.character)
          ),
        };
      });
      const configReadResult = await ConfigService.instance().readConfig(
        URI.file(this.wsRoot)
      );
      if (configReadResult.isErr()) {
        throw configReadResult.error;
      }
      const config = configReadResult.value;
      const {
        allDecorations: decorations,
        allDiagnostics: diagnostics,
        allErrors: errors,
      } = await runAllDecorators({ ...opts, note, engine: this, config });
      let error: IDendronError | undefined;
      if (errors && errors.length > 1)
        error = new DendronCompositeError(errors);
      else if (errors && errors.length === 1) error = errors[0];
      return {
        data: {
          decorations,
          diagnostics,
        },
        error,
      };
    } catch (err: any) {
      return {
        error: err,
        data: {},
      };
    }
  }

  private async initSchema(): Promise<RespWithOptError<SchemaModuleProps[]>> {
    const ctx = "DEngine:initSchema";
    this.logger.info({ ctx, msg: "enter" });
    let errorList: IDendronError[] = [];

    const schemaResponses: RespWithOptError<SchemaModuleProps[]>[] =
      await Promise.all(
        (this.vaults as DVault[]).map(async (vault) => {
          const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
          // Get list of files from filesystem
          const maybeFiles = await this._fileStore.readDir({
            root: URI.file(vpath),
            include: ["*.schema.yml"],
          });
          if (maybeFiles.error || maybeFiles.data.length === 0) {
            // Keep initializing other vaults
            return {
              error: new DendronCompositeError([
                new DendronError({
                  message: `Unable to get schemas for vault ${VaultUtils.getName(
                    vault
                  )}`,
                  status: ERROR_STATUS.NO_SCHEMA_FOUND,
                  severity: ERROR_SEVERITY.MINOR,
                  payload: maybeFiles.error,
                }),
              ]),
              data: [],
            };
          }
          const schemaFiles = maybeFiles.data.map((entry) => entry.toString());
          this.logger.info({ ctx, schemaFiles });
          const { schemas, errors } = await new SchemaParser({
            wsRoot: this.wsRoot,
            logger: this.logger,
          }).parse(schemaFiles, vault);

          if (errors) {
            errorList = errorList.concat(errors);
          }
          return {
            data: schemas,
            error: _.isNull(errors)
              ? undefined
              : new DendronCompositeError(errors),
          };
        })
      );
    const errors = schemaResponses
      .flatMap((response) => response.error)
      .filter(isNotUndefined);

    return {
      error: errors.length > 0 ? new DendronCompositeError(errors) : undefined,
      data: schemaResponses
        .flatMap((response) => response.data)
        .filter(isNotUndefined),
    };
  }

  /**
   * Construct dictionary of NoteProps from workspace on filesystem
   *
   * For every vault on the filesystem, get list of files and convert each file to NoteProp
   * @returns NotePropsByIdDict
   */
  private async initNotes(
    schemas: SchemaModuleDict
  ): Promise<RespWithOptError<NoteDicts>> {
    const ctx = "DEngine:initNotes";
    this.logger.info({ ctx, msg: "enter" });
    let errors: IDendronError[] = [];
    let notesFname: NotePropsByFnameDict = {};
    const start = process.hrtime();

    const allNotesList = await Promise.all(
      this.vaults.map(async (vault) => {
        const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
        // Get list of files from filesystem
        const maybeFiles = await this._fileStore.readDir({
          root: URI.file(vpath),
          include: ["*.md"],
        });
        if (maybeFiles.error) {
          // Keep initializing other vaults
          errors = errors.concat([
            new DendronError({
              message: `Unable to read notes for vault ${VaultUtils.getName(
                vault
              )}`,
              severity: ERROR_SEVERITY.MINOR,
              payload: maybeFiles.error,
            }),
          ]);
          return {};
        }

        // Load cache from vault
        const cachePath = path.join(vpath, CONSTANTS.DENDRON_CACHE_FILE);
        const notesCache = new NotesFileSystemCache({
          cachePath,
          // TODO: clean up
          noCaching: false,
          logger: this.logger,
        });

        const { noteDicts, errors: parseErrors } = await new NoteParserV2({
          cache: notesCache,
          engine: this,
          logger: this.logger,
        }).parseFiles(maybeFiles.data, vault, schemas);
        errors = errors.concat(parseErrors);
        if (noteDicts) {
          const { notesById, notesByFname } = noteDicts;
          notesFname = NoteFnameDictUtils.merge(notesFname, notesByFname);

          this.logger.info({
            ctx,
            vault,
            numEntries: _.size(notesById),
            numCacheUpdates: notesCache.numCacheMisses,
          });
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
    const duration = getDurationMilliseconds(start);
    this.logger.info({ ctx, msg: `time to init notes: "${duration}" ms` });

    return {
      data: {
        notesById: allNotes,
        notesByFname: notesFname,
      },
      error:
        errors.length === 0 ? undefined : new DendronCompositeError(errors),
    };
  }

  private createRenderedCache(
    config: DendronConfig
  ): Cache<string, CachedPreview> {
    const ctx = "createRenderedCache";

    const maxPreviewsCached =
      ConfigUtils.getWorkspace(config).maxPreviewsCached;
    if (maxPreviewsCached && maxPreviewsCached > 0) {
      this.logger.info({
        ctx,
        msg: `Creating rendered preview cache set to hold maximum of '${config.workspace.maxPreviewsCached}' items.`,
      });

      return new LruCache({ maxItems: maxPreviewsCached });
    } else {
      // This is most likely to happen if the user were to set incorrect configuration
      // value for maxPreviewsCached, we don't want to crash initialization due to
      // not being able to cache previews. Hence we will log an error and not use
      // the preview cache.
      this.logger.error({
        ctx,
        msg: `Did not find valid maxPreviewsCached (value was '${maxPreviewsCached}')
          in configuration. When specified th value must be a number greater than 0. Using null cache.`,
      });
      return new NullCache();
    }
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

  private async isCachedPreviewUpToDate(
    cachedPreview: CachedPreview,
    note: NoteProps
  ) {
    // Most of the times the preview is going to be invalidated by users making changes to
    // the note itself, hence before going through the trouble of checking whether linked
    // reference notes have been updated we should do the super cheap check to see
    // whether the note itself has invalidated the preview.
    if (note.contentHash !== cachedPreview.contentHash) {
      return false;
    }
    // TODO: Add another check to see if backlinks have changed

    const visitedIds = new Set<string>();
    return this._isCachedPreviewUpToDate({
      note,
      visitedIds,
      latestUpdated: cachedPreview.updated,
    });
  }

  /**
   * Check if there exists a note reference that is newer than the provided "latestUpdated"
   * This is used to determine if a cached preview is up-to-date
   *
   * Preview note tree includes links whose content is rendered in the rootNote preview,
   * particularly the reference links (![[ref-link-example]]).
   */
  private async _isCachedPreviewUpToDate({
    note,
    latestUpdated,
    visitedIds,
  }: {
    note: NotePropsMeta;
    latestUpdated: number;
    visitedIds: Set<string>;
  }): Promise<boolean> {
    if (note && note.updated > latestUpdated) {
      return false;
    }

    // Mark the visited nodes so we don't end up recursively spinning if there
    // are cycles in our preview tree such as [[foo]] -> [[!bar]] -> [[!foo]]
    if (visitedIds.has(note.id)) {
      return true;
    } else {
      visitedIds.add(note.id);
    }
    let linkedRefNotes = await Promise.all(
      note.links
        .filter((link) => link.type === "ref")
        .filter((link) => link.to && link.to.fname)
        .map(async (link) => {
          const pointTo = link.to!;
          // When there is a vault specified in the link we want to respect that
          // specification, otherwise we will map by just the file name.
          const maybeVault = pointTo.vaultName
            ? VaultUtils.getVaultByName({
                vname: pointTo.vaultName,
                vaults: this.vaults,
              })
            : undefined;

          return (
            await this.findNotesMeta({
              fname: pointTo.fname,
              vault: maybeVault,
            })
          )[0];
        })
    );
    linkedRefNotes = linkedRefNotes.filter((linkedNote) => !!linkedNote);

    for (const linkedNote of linkedRefNotes) {
      // Recurse into each child reference linked note.
      if (
        // eslint-disable-next-line no-await-in-loop
        !(await this._isCachedPreviewUpToDate({
          note: linkedNote,
          visitedIds,
          latestUpdated,
        }))
      ) {
        return false;
      }
    }

    return true;
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
    let proc: ReturnType<typeof MDUtilsV5["procRehypeFull"]>;
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(this.wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;

    const noteCacheForRenderDict = await getParsingDependencyDicts(
      note,
      this,
      config,
      this.vaults
    );

    if (dest === DendronASTDest.HTML) {
      proc = MDUtilsV5.procRehypeFull(
        {
          noteToRender: note,
          noteCacheForRenderDict,
          fname: note.fname,
          vault: note.vault,
          config,
          vaults: this.vaults,
          wsRoot: this.wsRoot,
        },
        { flavor }
      );
    } else {
      proc = MDUtilsV5.procRemarkFull(
        {
          noteToRender: note,
          noteCacheForRenderDict,
          fname: note.fname,
          vault: note.vault,
          dest,
          config,
          vaults: this.vaults,
          wsRoot: this.wsRoot,
        },
        { flavor }
      );
    }
    const payload = await proc.process(NoteUtils.serialize(note));
    const renderedNote = payload.toString();
    return renderedNote;
  }

  private updateNotesWithLinkCandidates(
    noteDicts: NoteDicts,
    maxNoteLength: number,
    config: DendronConfig
  ) {
    return _.map(noteDicts.notesById, (noteFrom: NoteProps) => {
      try {
        if (
          noteFrom.body.length <
          (maxNoteLength || CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH)
        ) {
          const linkCandidates = LinkUtils.findLinkCandidatesSync({
            note: noteFrom,
            noteDicts,
            config,
          });
          noteFrom.links = noteFrom.links.concat(linkCandidates);
        }
      } catch (err: any) {
        const error = error2PlainObject(err);
        this.logger.error({
          error,
          noteFrom,
          message: "issue with link candidates",
        });
        return;
      }
    });
  }
}

export const createEngineV3 = async ({ wsRoot }: WorkspaceOpts) => {
  const engine = await DendronEngineV3.create({ wsRoot });
  return engine as DEngineClient;
};
