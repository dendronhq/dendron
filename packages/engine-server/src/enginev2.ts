import {
  BulkAddNoteOpts,
  Cache,
  ConfigWriteOpts,
  CONSTANTS,
  DendronCompositeError,
  DendronConfig,
  DendronError,
  DEngine,
  DEngineClient,
  DEngineDeleteSchemaResp,
  DEngineInitResp,
  DEngineMode,
  DHookDict,
  DLink,
  DNodeType,
  DStore,
  DVault,
  EngineDeleteOptsV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  error2PlainObject,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FuseEngine,
  GetNoteBlocksOpts,
  GetNoteBlocksPayload,
  GetNoteOptsV2,
  GetNotePayload,
  IDendronError,
  LruCache,
  milliseconds,
  NoteChangeEntry,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  NullCache,
  QueryNotesOpts,
  RenameNoteOpts,
  RenameNotePayload,
  RenderNoteOpts,
  RenderNotePayload,
  ResponseUtil,
  RespV2,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaQueryResp,
  StatusCodes,
  VaultUtils,
  WorkspaceOpts,
  WriteNoteResp,
} from "@dendronhq/common-all";
import {
  createLogger,
  DLogger,
  NodeJSUtils,
  readYAML,
  writeYAML,
} from "@dendronhq/common-server";
import _ from "lodash";
import { DConfig } from "./config";
import { FileStorage } from "./drivers/file/storev2";
import { LinkUtils, MDUtilsV5, ProcFlavor } from "./markdown";
import { AnchorUtils, RemarkUtils } from "./markdown/remark/utils";
import { HookUtils } from "./topics/hooks";

type CreateStoreFunc = (engine: DEngineClient) => DStore;
type DendronEngineOptsV2 = {
  wsRoot: string;
  vaults: DVault[];
  forceNew?: boolean;
  createStore?: CreateStoreFunc;
  mode?: DEngineMode;
  logger?: DLogger;
  config: DendronConfig;
};
type DendronEnginePropsV2 = Required<DendronEngineOptsV2>;

type CachedPreview = {
  data: string;
  updated: number;
};

function createRenderedCache(
  config: DendronConfig,
  logger: DLogger
): Cache<string, CachedPreview> {
  const ctx = "createRenderedCache";

  if (config.noCaching) {
    // If no caching flag is set we will use null caching object to avoid doing any
    // actual caching of rendered previews.
    logger.info({
      ctx,
      msg: `noCaching flag is true, will NOT use preview cache.`,
    });

    return new NullCache();
  } else {
    if (config.maxPreviewsCached && config.maxPreviewsCached > 0) {
      logger.info({
        ctx,
        msg: `Creating rendered preview cache set to hold maximum of '${config.maxPreviewsCached}' items.`,
      });

      return new LruCache({ maxItems: config.maxPreviewsCached });
    } else {
      // This is most likely to happen if the user were to set incorrect configuration
      // value for maxPreviewsCached, we don't want to crash initialization due to
      // not being able to cache previews. Hence we will log an error and not use
      // the preview cache.
      logger.error({
        ctx,
        msg: `Did not find valid maxPreviewsCached (value was '${config.maxPreviewsCached}')
        in configuration. When specified th value must be a number greater than 0. Using null cache.`,
      });
      return new NullCache();
    }
  }
}

export class DendronEngineV2 implements DEngine {
  public wsRoot: string;
  public store: DStore;
  protected props: DendronEnginePropsV2;
  public logger: DLogger;
  public fuseEngine: FuseEngine;
  public links: DLink[];
  public configRoot: string;
  public config: DendronConfig;
  public hooks: DHookDict;
  private _vaults: DVault[];
  private renderedCache: Cache<string, CachedPreview>;

  static _instance: DendronEngineV2 | undefined;

  constructor(props: DendronEnginePropsV2) {
    this.wsRoot = props.wsRoot;
    this.configRoot = props.wsRoot;
    this.logger = props.logger;
    this.props = props;
    this.fuseEngine = new FuseEngine({});
    this.links = [];
    this.config = props.config;
    this._vaults = props.vaults;
    this.store = props.createStore(this);
    const hooks: DHookDict = _.get(props.config, "hooks", {
      onCreate: [],
    });
    this.hooks = hooks;
    this.renderedCache = createRenderedCache(this.config, this.logger);
  }

  static create({ wsRoot, logger }: { logger?: DLogger; wsRoot: string }) {
    const LOGGER = logger || createLogger();
    const cpath = DConfig.configPath(wsRoot);
    const config = _.defaultsDeep(
      readYAML(cpath) as DendronConfig,
      DConfig.genDefaultConfig()
    );

    return new DendronEngineV2({
      wsRoot,
      vaults: config.vaults,
      forceNew: true,
      createStore: (engine) =>
        new FileStorage({
          engine,
          logger: LOGGER,
        }),
      mode: "fuzzy",
      logger: LOGGER,
      config,
    });
  }

  static instance({ wsRoot }: { wsRoot: string }) {
    if (!DendronEngineV2._instance) {
      DendronEngineV2._instance = DendronEngineV2.create({ wsRoot });
    }
    return DendronEngineV2._instance;
  }

  get notes(): NotePropsDict {
    return this.store.notes;
  }
  get schemas(): SchemaModuleDict {
    return this.store.schemas;
  }

  get vaults(): DVault[] {
    return this._vaults;
  }

  set notes(notes: NotePropsDict) {
    this.store.notes = notes;
  }

  set vaults(vaults: DVault[]) {
    this._vaults = vaults;
    this.store.vaults = vaults;
  }

  /**
   * Does not throw error but returns it
   */
  async init(): Promise<DEngineInitResp> {
    try {
      const { data, error: storeError } = await this.store.init();
      if (_.isUndefined(data)) {
        return {
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.UNKNOWN,
            severity: ERROR_SEVERITY.FATAL,
          }),
        };
      }
      const { notes, schemas } = data;
      this.updateIndex("note");
      this.updateIndex("schema");
      const hookErrors: DendronError[] = [];
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
      const allErrors = (_.isNull(storeError) ? [] : [storeError]).concat(
        hookErrors
      );
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
    } catch (error) {
      const { message, stack, status } = error;
      let payload = { message, stack };
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

  async bulkAddNotes(opts: BulkAddNoteOpts) {
    const changed = await this.store.bulkAddNotes(opts);
    await this.refreshNotesV2(changed.data);
    return changed;
  }

  async deleteNote(
    id: string,
    opts?: EngineDeleteOptsV2
  ): ReturnType<DEngineClient["deleteNote"]> {
    try {
      const note = this.notes[id];
      const changed = await this.store.deleteNote(id, opts);
      const noteChangeEntry = _.find(
        changed,
        (ent) => ent.note.id === id
      ) as NoteChangeEntry;
      if (noteChangeEntry.status === "delete") {
        await this.fuseEngine.removeNoteFromIndex(note);
      }
      return {
        data: changed,
        error: null,
      };
    } catch (err) {
      return {
        data: [],
        error: err,
      };
    }
  }

  async deleteSchema(
    id: string,
    opts?: EngineDeleteOptsV2
  ): Promise<DEngineDeleteSchemaResp> {
    try {
      const data = (await this.store.deleteSchema(
        id,
        opts
      )) as DEngineDeleteSchemaResp;
      // deleted schema might affect notes
      await this.updateIndex("note");
      await this.updateIndex("schema");
      return data;
      // FIXM:E not performant
      // const smod = this.schemas[id];
      // await this.fuseEngine.removeSchemaFromIndex(smod);
      // return {
      //   data: undefined,
      //   error: null,
      // };
    } catch (err) {
      return {
        error: err,
      };
    }
  }

  async getNoteByPath({
    npath,
    createIfNew,
    vault,
    overrides,
  }: GetNoteOptsV2): Promise<RespV2<GetNotePayload>> {
    const ctx = "getNoteByPath";
    this.logger.debug({ ctx, npath, createIfNew, msg: "enter" });
    const maybeNote = NoteUtils.getNoteByFnameV5({
      fname: npath,
      notes: this.notes,
      vault,
      wsRoot: this.wsRoot,
    });
    this.logger.debug({ ctx, maybeNote, msg: "post-query" });
    let noteNew: NoteProps | undefined = maybeNote;
    let changed: NoteChangeEntry[] = [];
    let error = null;
    let updateExisting = false;
    if ((!maybeNote || maybeNote.stub) && createIfNew) {
      this.logger.debug({ ctx, maybeNote, msg: "create-new" });
      if (maybeNote?.stub) {
        noteNew = maybeNote;
        delete noteNew.stub;
        updateExisting = true;
      } else {
        noteNew = NoteUtils.createWithSchema({
          noteOpts: { fname: npath, vault },
          engine: this,
        });
      }
      noteNew = _.merge(noteNew, overrides || {});
      changed = (await this.writeNote(noteNew, { updateExisting })).data;
    }
    if (!createIfNew && !maybeNote) {
      error = new DendronError({ message: "no_note_found" });
    }
    await this.refreshNotesV2(changed);
    return {
      data: { note: noteNew, changed },
      error,
    };
  }

  async getConfig() {
    const cpath = DConfig.configPath(this.configRoot);
    const config = _.defaultsDeep(
      readYAML(cpath) as DendronConfig,
      DConfig.genDefaultConfig()
    );

    return {
      error: null,
      data: config,
    };
  }

  async getSchema(id: string): Promise<RespV2<SchemaModuleProps>> {
    const ctx = "getSchema";
    const data = this.schemas[id];
    this.logger.info({ ctx, msg: "exit" });
    return {
      data,
      error: null,
    };
  }

  async info() {
    return {
      data: {
        version: NodeJSUtils.getVersionFromPkg(),
      },
      error: null,
    };
  }

  queryNotesSync({
    qs,
  }: {
    qs: string;
  }): ReturnType<DEngineClient["queryNotesSync"]> {
    const items = this.fuseEngine.queryNote({ qs });
    return {
      error: null,
      data: items.map((ent) => this.notes[ent.id]),
    };
  }

  async querySchema(queryString: string): Promise<SchemaQueryResp> {
    const ctx = "querySchema";

    let items: SchemaModuleProps[] = [];
    const results = await this.fuseEngine.querySchema({ qs: queryString });
    items = results.map((ent) => this.schemas[ent.id]);
    // if (queryString === "") {
    //   items = [this.schemas.root];
    // } else if (queryString === "*") {
    //   items = _.values(this.schemas);
    // } else {
    //   const results = this.schemaIndex.search(queryString);
    //   items = _.map(results, (resp) => this.schemas[resp.item.id]);
    // }
    this.logger.info({ ctx, msg: "exit" });
    return {
      error: null,
      data: items,
    };
  }

  async queryNotes(
    opts: QueryNotesOpts
  ): ReturnType<DEngineClient["queryNotes"]> {
    const ctx = "Engine:queryNotes";
    const { qs, vault, createIfNew, onlyDirectChildren } = opts;

    let items = await this.fuseEngine.queryNote({ qs, onlyDirectChildren });
    let item = this.notes[items[0].id];
    if (createIfNew) {
      let noteNew: NoteProps;
      if (item?.fname === qs && item?.stub) {
        noteNew = item;
        noteNew.stub = false;
      } else {
        if (_.isUndefined(vault)) {
          return {
            error: new DendronError({ message: "no vault specified" }),
            data: null as any,
          };
        }
        noteNew = NoteUtils.create({ fname: qs, vault });
      }
      const changed = await this.writeNote(noteNew, { newNode: true });
      await this.refreshNotesV2(changed.data);
    }
    this.logger.info({ ctx, msg: "exit" });
    let notes = items.map((ent) => this.notes[ent.id]);
    if (!_.isUndefined(vault)) {
      notes = notes.filter((ent) =>
        VaultUtils.isEqual(vault, ent.vault, this.wsRoot)
      );
    }
    return {
      error: null,
      data: notes,
    };
  }

  async renderNote({ id }: RenderNoteOpts): Promise<RespV2<RenderNotePayload>> {
    const ctx = "DendronEngineV2:renderNote";

    const note = this.notes[id];

    if (!note) {
      return ResponseUtil.createUnhappyResponse({
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `${id} does not exist`,
          code: StatusCodes.BAD_REQUEST,
        }),
      });
    }

    const cachedPreview = this.renderedCache.get(id);
    if (cachedPreview) {
      if (this.isCachedPreviewUpToDate(cachedPreview, note)) {
        this.logger.info({ ctx, id, msg: `Will use cached rendered preview.` });

        // Cached preview updated time is the same as note.updated time.
        // Hence we can skip re-rendering and return the cached version of preview.
        return ResponseUtil.createHappyResponse({ data: cachedPreview.data });
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
    const data = await this._renderNote(note);

    this.renderedCache.set(id, {
      updated: note.updated,
      data: data,
    });

    const duration = milliseconds() - beforeRenderMillis;
    this.logger.info({ ctx, id, duration, msg: `Render preview finished.` });
    return ResponseUtil.createHappyResponse({ data });
  }

  private isCachedPreviewUpToDate(
    cachedPreview: CachedPreview,
    note: NoteProps
  ) {
    // Most of the times the preview is going to be invalidated by users making changes to
    // the note itself, hence before going through the trouble of checking whether linked
    // reference notes have been updated we should do the super cheap check to see
    // whether the note itself has invalidated the preview.
    if (note.updated > cachedPreview.updated) {
      return false;
    }

    return (
      cachedPreview.updated >=
      NoteUtils.getLatestUpdateTimeOfPreviewNoteTree({
        rootNote: note,
        notes: this.notes,
      })
    );
  }

  private async _renderNote(note: NoteProps): Promise<string> {
    const proc = MDUtilsV5.procRehypeFull(
      {
        engine: this,
        fname: note.fname,
        vault: note.vault,
        config: this.config,
      },
      { flavor: ProcFlavor.PREVIEW }
    );
    const payload = await proc.process(NoteUtils.serialize(note));
    return payload.toString();
  }
  async sync() {
    throw Error("sync not implemented");
    return {} as any;
  }

  async refreshNotesV2(notes: NoteChangeEntry[]) {
    const notesMap = NoteUtils.createFnameNoteMap(_.values(this.notes), true);
    await Promise.all(
      notes.map(async (ent: NoteChangeEntry) => {
        const { id } = ent.note;
        if (ent.status === "delete") {
          delete this.notes[id];
        } else {
          if (ent.status === "create") {
          }
          if (
            ent.note.body.length <
            (this.config.maxNoteLength ||
              CONSTANTS.DENDRON_DEFAULT_MAX_NOTE_LENGTH)
          ) {
            const links = LinkUtils.findLinks({ note: ent.note, engine: this });
            const linkCandidates = LinkUtils.findLinkCandidates({
              note: ent.note,
              notesMap,
              engine: this,
            });
            const anchors = await AnchorUtils.findAnchors({
              note: ent.note,
              wsRoot: this.wsRoot,
            });
            ent.note.links = links.concat(linkCandidates);
            ent.note.anchors = anchors;
          }
          this.notes[id] = ent.note;
        }
      })
    );
    this.fuseEngine.updateNotesIndex(this.notes);
  }

  async renameNote(opts: RenameNoteOpts): Promise<RespV2<RenameNotePayload>> {
    try {
      const resp = await this.store.renameNote(opts);
      await this.refreshNotesV2(resp);
      return {
        error: null,
        data: resp,
      };
    } catch (err: any) {
      let error = err;
      if (err instanceof DendronError) error = error2PlainObject(err);
      if (_.isUndefined(err.message)) err.message = "rename error";
      return { error };
    }
  }

  /**
   * See {@link FileStorageV2.updateNote}
   * @param note
   * @param opts
   * @returns
   */
  async updateNote(note: NoteProps, opts?: EngineUpdateNodesOptsV2) {
    const out = this.store.updateNote(note, opts);
    await this.updateIndex("note");
    return out;
  }

  async updateIndex(mode: DNodeType) {
    if (mode === "schema") {
      this.fuseEngine.updateSchemaIndex(this.schemas);
    } else {
      this.fuseEngine.updateNotesIndex(this.notes);
    }
  }

  async updateSchema(schemaModule: SchemaModuleProps) {
    const out = await this.store.updateSchema(schemaModule);
    await this.updateIndex("schema");
    return out;
  }

  async writeConfig(opts: ConfigWriteOpts): ReturnType<DEngine["writeConfig"]> {
    const { configRoot } = this;
    const cpath = DConfig.configPath(configRoot);
    writeYAML(cpath, opts.config);
    return {
      error: null,
    };
  }

  async addAccessTokensToPodConfig(opts: {
    path: string;
    tokens: {
      accessToken: string;
      expirationTime: number;
      refreshToken?: string;
    };
  }) {
    const { path, tokens } = opts;
    const { accessToken, refreshToken, expirationTime } = tokens;

    let podConfig = readYAML(path);

    podConfig = {
      ...podConfig,
      accessToken,
      expirationTime,
    };
    if (!_.isUndefined(refreshToken)) {
      podConfig = {
        ...podConfig,
        refreshToken,
      };
    }
    writeYAML(path, podConfig);
  }

  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const out = await this.store.writeNote(note, opts);
    await this.refreshNotesV2(out.data);
    return out;
  }

  async writeSchema(schema: SchemaModuleProps) {
    return this.store.writeSchema(schema);
  }

  async getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksPayload> {
    const note = this.notes[opts.id];
    try {
      if (_.isUndefined(note))
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `${opts.id} does not exist`,
        });
      const blocks = await RemarkUtils.extractBlocks({
        note,
        engine: this,
      });
      if (opts.filterByAnchorType) {
        _.remove(
          blocks,
          (block) => block.anchor?.type !== opts.filterByAnchorType
        );
      }
      return { data: blocks, error: null };
    } catch (err) {
      return {
        error: err,
        data: undefined,
      };
    }
  }
}

export const createEngine = ({ wsRoot }: WorkspaceOpts) => {
  const engine = DendronEngineV2.create({ wsRoot });
  return engine as DEngineClient;
};
