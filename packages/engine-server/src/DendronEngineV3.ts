import {
  BulkResp,
  BulkWriteNotesOpts,
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
  DNoteLoc,
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
  isNotNull,
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
  RenameNoteOpts,
  RenameNotePayload,
  RenderNotePayload,
  RespV2,
  RespV3,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaQueryResp,
  stringifyError,
  TAGS_HIERARCHY,
  UpdateNoteResp,
  USERS_HIERARCHY,
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
import { EngineUtils } from "./utils/engineUtils";

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
    let changes: NoteChangeEntry[] = [];
    let error: DendronError | null = null;
    const ctx = "DEngine:writeNewNote";
    this.logger.info({
      ctx,
      msg: `enter with ${opts}`,
      note: NoteUtils.toLogObj(note),
    });

    // Update links/anchors based on note body
    // TODO: update backlinks as well
    EngineUtils.refreshNoteLinksAndAnchors({
      note,
      engine: this,
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
    if (existingNote && existingNote.id === note.id) {
      // If a note exist with the same id, then we treat this as an update
      changes.push({ prevNote: existingNote, note, status: "update" });
    } else {
      changes.push({ note, status: "create" });
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

  /**
   * See {@link DEngine.bulkWriteNotes}
   */
  async bulkWriteNotes(
    opts: BulkWriteNotesOpts
  ): Promise<Required<BulkResp<NoteChangeEntry[]>>> {
    const writeResponses = await Promise.all(
      opts.notes.map((note) => this.writeNote(note, opts.opts))
    );
    const errors = writeResponses
      .flatMap((response) => response.error)
      .filter(isNotNull);

    return {
      error: errors.length > 0 ? new DendronCompositeError(errors) : null,
      data: writeResponses
        .flatMap((response) => response.data)
        .filter(isNotUndefined),
    };
  }

  /**
   * See {@link DEngine.deleteNote}
   */
  async deleteNote(
    id: string,
    opts?: EngineDeleteOpts
  ): Promise<EngineDeleteNoteResp> {
    const ctx = "DEngine:deleteNote";
    if (id === "root") {
      throw new DendronError({
        message: "",
        status: ERROR_STATUS.CANT_DELETE_ROOT,
      });
    }
    let changes: NoteChangeEntry[] = [];

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

    if (!noteToDelete.parent) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
          message: `No parent found for ${noteToDelete.fname}`,
        }),
      };
    }
    const parentResp = await this._noteStore.get(noteToDelete.parent);
    if (parentResp.error) {
      return {
        error: new DendronError({
          status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
          message: `Unable to delete ${noteToDelete.fname}: Note's parent does not exist in engine: ${noteToDelete.parent}`,
          innerError: parentResp.error,
        }),
      };
    }

    let parentNote = parentResp.data;

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

      // Move children to new note
      changes = changes.concat(
        await this.updateChildrenWithNewParent(noteToDelete, replacingStub)
      );

      changes.push({ note: replacingStub, status: "create" });
    } else {
      // If parent is a stub, go upwards up the tree and delete rest of stubs
      while (parentNote.stub) {
        changes.push({ note: parentNote, status: "delete" });
        if (!parentNote.parent) {
          return {
            error: new DendronError({
              status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
              message: `No parent found for ${parentNote.fname}`,
            }),
          };
        }
        // eslint-disable-next-line no-await-in-loop
        const parentResp = await this._noteStore.get(parentNote.parent);
        if (parentResp.data) {
          prevNote = { ...parentNote };
          parentNote = parentResp.data;
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

  /**
   * See {@link DEngine.renameNote}
   *
   * TODO: make atomic
   */
  async renameNote(opts: RenameNoteOpts): Promise<RespV2<RenameNotePayload>> {
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

    // Get list of notes referencing old note. We need to rename those references
    const notesReferencingOld = _.uniq(
      oldNote.links
        .map((link) => {
          if (link.type === "backlink") {
            return link.from.id;
          } else {
            return undefined;
          }
        })
        .filter(isNotUndefined)
    );

    const linkNotesResp = await this._noteStore.bulkGet(notesReferencingOld);

    // update note body of all notes that have changed
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
          return this.processNoteChangedByRename({
            note: resp.data,
            oldLoc,
            newLoc,
          });
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
    let notesChangedEntries = writeResp.data;

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
        notesChangedEntries = out.data.concat(notesChangedEntries);
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
    return { data: notesChangedEntries, error: null };
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
    const ctx = "DEngine:queryNotes";
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

  /**
   * @deprecated: Use {@link DEngine.writeNote}
   */
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
   * @deprecated: Use {@link LinkUtils.findLinks}
   */
  async getLinks(
    opts: Optional<GetLinksRequest, "ws">
  ): Promise<GetNoteLinksPayload> {
    const { type, note } = opts;
    return {
      data: LinkUtils.findLinks({
        note,
        type,
        engine: this,
      }),
      error: null,
    };
  }

  /**
   * @deprecated: Use {@link AnchorUtils.findAnchors}
   */
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

  /**
   * Update the links inside this note that need to be updated for the rename from `oldLoc` to `newLoc`
   * Will update the note in place and return note if something has changed
   */
  private processNoteChangedByRename({
    note,
    oldLoc,
    newLoc,
  }: {
    note: NoteProps;
    oldLoc: DNoteLoc;
    newLoc: DNoteLoc;
  }): NoteProps | undefined {
    const prevNote = _.cloneDeep(note);
    const foundLinks = LinkUtils.findLinksFromBody({
      note,
      engine: this,
      filter: { loc: oldLoc },
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
        // for user tag links, we'll have to regenerate the alias
        if (newLoc.fname.startsWith(USERS_HIERARCHY)) {
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
}

export const createEngineV3 = ({ wsRoot }: WorkspaceOpts) => {
  const engine = DendronEngineV3.create({ wsRoot });
  return engine as DEngineClient;
};
