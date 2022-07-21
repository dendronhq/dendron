import {
  assertUnreachable,
  BulkResp,
  ConfigUtils,
  CONSTANTS,
  DendronCompositeError,
  DendronError,
  DEngine,
  DEngineClient,
  DEngineDeleteSchemaResp,
  DEngineInitResp,
  DEngineMode,
  DHookDict,
  DHookEntry,
  DLink,
  DNodeUtils,
  DStore,
  DVault,
  EngineDeleteNoteResp,
  EngineDeleteOpts,
  EngineInfoResp,
  EngineWriteOptsV2,
  error2PlainObject,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  FuseEngine,
  GetAnchorsRequest,
  GetDecorationsPayload,
  GetLinksRequest,
  GetNoteAnchorsPayload,
  GetNoteBlocksPayload,
  GetNoteLinksPayload,
  IDendronError,
  IFileStore,
  INoteStore,
  IntermediateDendronConfig,
  isNotUndefined,
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  NoteQueryResp,
  NoteUtils,
  Optional,
  QueryNotesOpts,
  RenameNotePayload,
  RenderNotePayload,
  RespV2,
  RespV3,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaQueryResp,
  stringifyError,
  UpdateNoteResp,
  VaultUtils,
  WorkspaceOpts,
  WriteNoteResp,
} from "@dendronhq/common-all";
import {
  createLogger,
  DLogger,
  getDurationMilliseconds,
  NodeJSUtils,
  readYAML,
  vault2Path,
} from "@dendronhq/common-server";
import _ from "lodash";
import { NodeJSFileStore, NoteStore } from "./store";
import { DConfig } from "./config";
import { AnchorUtils, LinkUtils } from "./markdown";
import { NoteMetadataStore } from "./store/NoteMetadataStore";
import { HookUtils, RequireHookResp } from "./topics/hooks";
import { NoteParserV2 } from "./drivers/file/NoteParserV2";
import path from "path";
import { NotesFileSystemCache } from "./cache/notesFileSystemCache";
import { FileStorage } from "./drivers/file/storev2";

type DendronEngineOptsV3 = {
  wsRoot: string;
  vaults: DVault[];
  fileStore: IFileStore;
  noteStore: INoteStore<string>;
  forceNew?: boolean;
  mode?: DEngineMode;
  logger?: DLogger;
  config: IntermediateDendronConfig;
};
type DendronEnginePropsV3 = Required<DendronEngineOptsV3>;

export class DendronEngineV3 implements DEngine {
  public wsRoot: string;
  public store: DStore;
  protected props: DendronEnginePropsV3;
  public logger: DLogger;
  public fuseEngine: FuseEngine;
  public links: DLink[];
  public configRoot: string;
  public config: IntermediateDendronConfig;
  public hooks: DHookDict;
  private _vaults: DVault[];
  private _fileStore: IFileStore;
  private _noteStore: INoteStore<string>;

  static _instance: DendronEngineV3 | undefined;

  constructor(props: DendronEnginePropsV3) {
    this.wsRoot = props.wsRoot;
    this.configRoot = props.wsRoot;
    this.logger = props.logger;
    this.props = props;
    this.fuseEngine = new FuseEngine({
      fuzzThreshold: ConfigUtils.getLookup(props.config).note.fuzzThreshold,
    });
    this.links = [];
    this.config = props.config;
    this._vaults = props.vaults;
    const hooks: DHookDict = ConfigUtils.getWorkspace(props.config).hooks || {
      onCreate: [],
    };
    this.hooks = hooks;
    this._fileStore = props.fileStore;
    this._noteStore = props.noteStore;

    // TODO: remove after migration
    this.store = new FileStorage({
      engine: this,
      logger: this.logger,
    });
  }

  static create({ wsRoot, logger }: { logger?: DLogger; wsRoot: string }) {
    const LOGGER = logger || createLogger();
    const { error, data: config } =
      DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
    if (error) {
      LOGGER.error(stringifyError(error));
    }
    const fileStore = new NodeJSFileStore();

    return new DendronEngineV3({
      wsRoot,
      vaults: ConfigUtils.getVaults(config),
      forceNew: true,
      noteStore: new NoteStore({
        fileStore,
        dataStore: new NoteMetadataStore(),
        wsRoot,
      }),
      fileStore,
      mode: "fuzzy",
      logger: LOGGER,
      config,
    });
  }

  static instance({ wsRoot }: { wsRoot: string }) {
    if (!DendronEngineV3._instance) {
      DendronEngineV3._instance = DendronEngineV3.create({ wsRoot });
    }
    return DendronEngineV3._instance;
  }

  /**
   * @deprecated
   * For accessing a specific note by id, see {@link DendronEngineV3.getNote}.
   * If you need all notes, avoid modifying any note as this will cause unintended changes on the store side
   */
  get notes(): NotePropsByIdDict {
    return this.store.notes;
  }
  /**
   * @deprecated see {@link DendronEngineV3.findNotes}
   */
  get noteFnames() {
    return this.store.noteFnames;
  }
  get schemas(): SchemaModuleDict {
    return this.store.schemas;
  }

  get vaults(): DVault[] {
    return this._vaults;
  }

  set vaults(vaults: DVault[]) {
    this._vaults = vaults;
  }

  /**
   * Does not throw error but returns it
   */
  async init(): Promise<DEngineInitResp> {
    try {
      const { data: notes, error: storeError } = await this.initNotes();

      // TODO: add schemas to notes
      const schemas = {};

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
      this.logger.info({ ctx: "init:ext", error, storeError, hookErrors });
      return {
        error,
        data: {
          notes,
          schemas,
          wsRoot: this.wsRoot,
          vaults: this.vaults,
          config: this.config,
        },
      };
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

  /**
   * See {@link DEngine.writeNote}
   */
  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const changes: NoteChangeEntry[] = [];
    let error: DendronError | null = null;
    const ctx = "writeNewNote";
    this.logger.info({
      ctx,
      msg: `enter with ${opts}`,
      note: NoteUtils.toLogObj(note),
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
        error = resp;
        this.logger.error({ ctx, error: stringifyError(error) });
      } else {
        const valResp = NoteUtils.validate(resp.note);
        if (valResp instanceof DendronError) {
          error = valResp;
          this.logger.error({ ctx, error: stringifyError(error) });
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
        const parentResp = await this._noteStore.find({
          child: existingNote,
        });
        if (!parentResp.data || parentResp.data.length === 0) {
          return {
            error: new DendronError({
              status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
              message: `No parent found for ${existingNote.fname}`,
            }),
          };
        }

        // Save the state of the parent to later record changed entry.
        const parent = parentResp.data[0];
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

        // Move existing note's children to new note
        const childrenResp = await this._noteStore.bulkGet(
          existingNote.children
        );
        childrenResp.forEach((child) => {
          if (child.data) {
            const childNote = child.data;
            const prevChildNoteState = { ...childNote };
            DNodeUtils.addChild(note, childNote);

            // Add one entry for each child updated
            changes.push({
              prevNote: prevChildNoteState,
              note: childNote,
              status: "update",
            });
          }
        });

        // Delete the existing note
        const deleteResp = opts?.metaOnly
          ? await this._noteStore.deleteMetadata(existingNote.id)
          : await this._noteStore.delete(existingNote.id);
        if (deleteResp.error) {
          return {
            error: new DendronError({
              message: `Unable to delete note ${existingNote.id}`,
              severity: ERROR_SEVERITY.MINOR,
              payload: deleteResp.error,
            }),
          };
        }

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
        const ancestorResp = await this._noteStore.find({ child: note });
        if (ancestorResp.data && ancestorResp.data.length === 1) {
          const ancestor = ancestorResp.data[0];

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

    this.logger.info({
      ctx,
      msg: "exit",
      changed: changes.map((n) => NoteUtils.toLogObj(n.note)),
    });
    return {
      error,
      data: changes,
    };
  }

  async bulkWriteNotes(): Promise<Required<BulkResp<NoteChangeEntry[]>>> {
    throw new Error("bulkWriteNotes not implemented");
  }

  /**
   * See {@link DEngine.deleteNote}
   */
  async deleteNote(
    id: string,
    opts?: EngineDeleteOpts
  ): Promise<EngineDeleteNoteResp> {
    const ctx = "deleteNote";
    if (id === "root") {
      throw new DendronError({
        message: "",
        status: ERROR_STATUS.CANT_DELETE_ROOT,
      });
    }
    const changes: NoteChangeEntry[] = [];

    const resp = await this._noteStore.getMetadata(id);
    if (resp.error) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.DOES_NOT_EXIST,
          message: `Unable to delete ${id}: Note does not exist`,
        }),
      };
    }
    // Temp solution to get around current restrictions where NoteChangeEntry needs a NoteProp
    const noteToDelete = _.merge(resp.data, {
      body: "",
    });
    this.logger.info({ ctx, noteToDelete, opts, id });
    const noteAsLog = NoteUtils.toLogObj(noteToDelete);

    const parentResp = await this._noteStore.find({
      child: noteToDelete,
    });
    if (!parentResp.data || parentResp.data.length === 0) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
          message: `Unable to delete ${noteToDelete.fname}: Note's parent does not exist in engine: ${noteToDelete.parent}`,
        }),
      };
    }
    let parentNote = parentResp.data[0];

    let prevNote = { ...noteToDelete };
    // If deleted note has children, create stub note with a new id in metadata store
    if (!_.isEmpty(noteToDelete.children)) {
      this.logger.info({ ctx, noteAsLog, msg: "keep as stub" });
      const replacingStub = NoteUtils.create({
        // the replacing stub should not keep the old note's body, id, and links.
        // otherwise, it will be captured while processing links and will
        // fail because this note is not actually in the file system.
        ..._.omit(noteToDelete, ["id", "links", "body"]),
        stub: true,
      });

      DNodeUtils.addChild(parentNote, replacingStub);
      changes.push({ note: replacingStub, status: "create" });
    } else {
      // If parent is a stub, go upwards up the tree and delete rest of stubs
      while (parentNote.stub) {
        changes.push({ note: parentNote, status: "delete" });
        // eslint-disable-next-line no-await-in-loop
        const parentResp = await this._noteStore.find({
          child: parentNote,
        });
        if (parentResp.data && parentResp.data.length > 0) {
          prevNote = { ...parentNote };
          parentNote = parentResp.data[0];
        } else {
          return {
            error: new DendronError({
              status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
              message: `Unable to delete ${noteToDelete.fname}: Note ${parentNote?.fname}'s parent does not exist in engine: ${parentNote.parent}`,
            }),
          };
        }
      }
    }

    // Delete note reference from parent's child
    const parentNotePrev = { ...parentNote };
    this.logger.info({ ctx, noteAsLog, msg: "delete from parent" });
    DNodeUtils.removeChild(parentNote, prevNote);

    // Add an entry for the updated parent
    changes.push({
      prevNote: parentNotePrev,
      note: parentNote,
      status: "update",
    });

    const deleteResp = opts?.metaOnly
      ? await this._noteStore.deleteMetadata(id)
      : await this._noteStore.delete(id);
    if (deleteResp.error) {
      return {
        error: new DendronError({
          message: `Unable to delete note ${id}`,
          severity: ERROR_SEVERITY.MINOR,
          payload: deleteResp.error,
        }),
      };
    }

    changes.push({ note: noteToDelete, status: "delete" });
    // Update metadata for all other changes
    await this.fuseEngine.updateNotesIndex(changes);
    await this.updateNoteMetadataStore(changes);

    this.logger.info({
      ctx,
      msg: "exit",
      changed: changes.map((n) => NoteUtils.toLogObj(n.note)),
    });
    return {
      error: null,
      data: changes,
    };
  }

  async deleteSchema(): Promise<DEngineDeleteSchemaResp> {
    throw Error("deleteSchema not implemented");
  }

  async getConfig() {
    const cpath = DConfig.configPath(this.configRoot);
    const config = _.defaultsDeep(
      readYAML(cpath) as IntermediateDendronConfig,
      ConfigUtils.genDefaultConfig()
    );

    return {
      error: null,
      data: config,
    };
  }

  async getSchema(): Promise<RespV2<SchemaModuleProps>> {
    throw Error("getSchema not implemented");
  }

  async info(): Promise<RespV2<EngineInfoResp>> {
    const version = NodeJSUtils.getVersionFromPkg();
    if (!version) {
      return {
        data: undefined,
        error: DendronError.createPlainError({
          message: "Unable to read Dendron version",
        }),
      };
    }
    return {
      data: {
        version,
      },
      error: null,
    };
  }

  queryNotesSync(): ReturnType<DEngineClient["queryNotesSync"]> {
    throw Error("queryNotesSync not implemented");
  }

  async querySchema(): Promise<SchemaQueryResp> {
    throw Error("querySchema not implemented");
  }

  /**
   * See {@link DEngine.queryNotes}
   */
  async queryNotes(opts: QueryNotesOpts): Promise<NoteQueryResp> {
    const ctx = "Engine:queryNotes";
    const { qs, vault, onlyDirectChildren, originalQS } = opts;

    // Need to ignore this because the engine stringifies this property, so the types are incorrect.
    // @ts-ignore
    if (vault?.selfContained === "true" || vault?.selfContained === "false")
      vault.selfContained = vault.selfContained === "true";

    const noteIds = this.fuseEngine
      .queryNote({
        qs,
        onlyDirectChildren,
        originalQS,
      })
      .map((ent) => ent.id);

    if (noteIds.length === 0) {
      return { error: null, data: [] };
    }

    this.logger.info({ ctx, msg: "exit" });
    const responses = await this._noteStore.bulkGet(noteIds);
    let notes = responses.map((resp) => resp.data).filter(isNotUndefined);
    if (!_.isUndefined(vault)) {
      notes = notes.filter((ent) => {
        return VaultUtils.isEqual(vault, ent.vault, this.wsRoot);
      });
    }
    return {
      error: null,
      data: notes,
    };
  }

  async renderNote(): Promise<RespV2<RenderNotePayload>> {
    throw Error("renderNote not implemented");
  }

  async sync(): Promise<never> {
    throw Error("sync not implemented");
  }

  async refreshNotes(): Promise<RespV2<void>> {
    throw new Error("sync not implemented");
  }

  async renameNote(): Promise<RespV2<RenameNotePayload>> {
    throw Error("renameNote not implemented");
  }

  async updateNote(): Promise<UpdateNoteResp> {
    throw new Error("updateNote not implemented");
  }

  async updateSchema() {
    throw Error("updateSchema not implemented");
  }

  async writeConfig(): ReturnType<DEngine["writeConfig"]> {
    throw Error("writeConfig not implemented");
  }

  async addAccessTokensToPodConfig() {
    throw Error("addAccessTokensToPodConfig not implemented");
  }

  async writeSchema() {
    throw Error("writeSchema not implemented");
  }

  async getNoteBlocks(): Promise<GetNoteBlocksPayload> {
    throw Error("getNoteBlocks not implemented");
  }

  async getDecorations(): Promise<GetDecorationsPayload> {
    throw Error("getDecorations not implemented");
  }

  /**
   * TODO: Fix backlinks not being updated when adding new reference to another note or renaming old reference
   */
  async getLinks(
    opts: Optional<GetLinksRequest, "ws">
  ): Promise<GetNoteLinksPayload> {
    const { type, note } = opts;
    let links;
    switch (type) {
      case "regular":
        links = LinkUtils.findLinks({
          note,
          engine: this,
        });
        break;
      case "candidate":
        links = LinkUtils.findLinkCandidates({
          note,
          engine: this,
        });
        break;
      default:
        assertUnreachable(type);
    }
    const backlinks = note.links.filter((link) => link.type === "backlink");
    return { data: links.concat(backlinks), error: null };
  }

  async getAnchors(opts: GetAnchorsRequest): Promise<GetNoteAnchorsPayload> {
    return {
      data: AnchorUtils.findAnchors({
        note: opts.note,
      }),
      error: null,
    };
  }

  /**
   * Construct dictionary of NoteProps from workspace on filesystem
   *
   * For every vault on the filesystem, get list of files and convert each file to NoteProp
   * @returns NotePropsByIdDict
   */
  private async initNotes(): Promise<BulkResp<NotePropsByIdDict>> {
    const ctx = "DendronEngineV3:initNotes";
    this.logger.info({ ctx, msg: "enter" });
    let errors: IDendronError[] = [];
    let notesFname: NotePropsByFnameDict = {};
    const start = process.hrtime();

    const allNotesList = await Promise.all(
      this.vaults.map(async (vault) => {
        const vpath = vault2Path({ vault, wsRoot: this.wsRoot });
        // Get list of files from filesystem
        const maybeFiles = await this._fileStore.readDir({
          root: vpath,
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
          noCaching: this.config.noCaching,
          logger: this.logger,
        });

        const { data: notesDict, error } = await new NoteParserV2({
          cache: notesCache,
          engine: this,
          logger: this.logger,
          maxNoteLength: ConfigUtils.getWorkspace(this.config).maxNoteLength,
        }).parseFiles(maybeFiles.data, vault);
        if (error) {
          errors = errors.concat(error?.errors);
        }
        if (notesDict) {
          const { notesById, notesByFname } = notesDict;
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
        const error = error2PlainObject(err);
        this.logger.error({ error, noteFrom, message: "issue with backlinks" });
      }
    });
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
      changes
        .filter((change) => change.status !== "delete")
        .map((change) => {
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
}

export const createEngineV3 = ({ wsRoot }: WorkspaceOpts) => {
  const engine = DendronEngineV3.create({ wsRoot });
  return engine as DEngineClient;
};
