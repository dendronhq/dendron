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
  DLink,
  DStore,
  DVault,
  EngineInfoResp,
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
  NoteChangeEntry,
  NoteDicts,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  NoteUtils,
  Optional,
  RenameNotePayload,
  RenderNotePayload,
  RespV2,
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
import { HookUtils } from "./topics/hooks";
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
      this.fuseEngine.updateNotesIndex(notes);
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

  async bulkWriteNotes(): Promise<Required<BulkResp<NoteChangeEntry[]>>> {
    throw new Error("bulkWriteNotes not implemented");
  }

  async deleteNote(): ReturnType<DEngineClient["deleteNote"]> {
    throw Error("deleteNote not implemented");
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

  async queryNotes(): ReturnType<DEngineClient["queryNotes"]> {
    throw Error("queryNotes not implemented");
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

  async writeNote(): Promise<WriteNoteResp> {
    throw Error("writeNote not implemented");
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
}

export const createEngineV3 = ({ wsRoot }: WorkspaceOpts) => {
  const engine = DendronEngineV3.create({ wsRoot });
  return engine as DEngineClient;
};
