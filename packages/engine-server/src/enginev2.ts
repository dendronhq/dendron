import {
  assertUnreachable,
  BulkWriteNotesOpts,
  Cache,
  ConfigUtils,
  ConfigWriteOpts,
  DendronASTDest,
  DendronCompositeError,
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
  EngineInfoResp,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  error2PlainObject,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  FuseEngine,
  GetAnchorsRequest,
  GetDecorationsOpts,
  GetDecorationsPayload,
  GetLinksRequest,
  GetNoteAnchorsPayload,
  GetNoteBlocksOpts,
  GetNoteBlocksPayload,
  GetNoteLinksPayload,
  IDendronError,
  IntermediateDendronConfig,
  LruCache,
  milliseconds,
  newRange,
  NoteChangeEntry,
  NoteDictsUtils,
  NoteProps,
  NotePropsByIdDict,
  NoteUtils,
  NullCache,
  Optional,
  QueryNotesOpts,
  RefreshNotesOpts,
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
  stringifyError,
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
import { EngineUtils } from ".";
import { DConfig } from "./config";
import { FileStorage } from "./drivers/file/storev2";
import { AnchorUtils, LinkUtils, MDUtilsV5, ProcFlavor } from "./markdown";
import { runAllDecorators } from "./markdown/decorations";
import { RemarkUtils } from "./markdown/remark/utils";
import { HookUtils } from "./topics/hooks";

type CreateStoreFunc = (engine: DEngineClient) => DStore;
type DendronEngineOptsV2 = {
  wsRoot: string;
  vaults: DVault[];
  forceNew?: boolean;
  createStore?: CreateStoreFunc;
  mode?: DEngineMode;
  logger?: DLogger;
  config: IntermediateDendronConfig;
};
type DendronEnginePropsV2 = Required<DendronEngineOptsV2>;

type CachedPreview = {
  data: string;
  updated: number;
  contentHash?: string;
};

function createRenderedCache(
  config: IntermediateDendronConfig,
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
    const maxPreviewsCached =
      ConfigUtils.getWorkspace(config).maxPreviewsCached;
    if (maxPreviewsCached && maxPreviewsCached > 0) {
      logger.info({
        ctx,
        msg: `Creating rendered preview cache set to hold maximum of '${config.maxPreviewsCached}' items.`,
      });

      return new LruCache({ maxItems: maxPreviewsCached });
    } else {
      // This is most likely to happen if the user were to set incorrect configuration
      // value for maxPreviewsCached, we don't want to crash initialization due to
      // not being able to cache previews. Hence we will log an error and not use
      // the preview cache.
      logger.error({
        ctx,
        msg: `Did not find valid maxPreviewsCached (value was '${maxPreviewsCached}')
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
  public config: IntermediateDendronConfig;
  public hooks: DHookDict;
  private _vaults: DVault[];
  private renderedCache: Cache<string, CachedPreview>;

  static _instance: DendronEngineV2 | undefined;

  constructor(props: DendronEnginePropsV2) {
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
    this.store = props.createStore(this);
    const hooks: DHookDict = ConfigUtils.getWorkspace(props.config).hooks || {
      onCreate: [],
    };
    this.hooks = hooks;
    this.renderedCache = createRenderedCache(this.config, this.logger);
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

  static create({ wsRoot, logger }: { logger?: DLogger; wsRoot: string }) {
    const LOGGER = logger || createLogger();
    const { error, data: config } =
      DConfig.readConfigAndApplyLocalOverrideSync(wsRoot);
    if (error) {
      LOGGER.error(stringifyError(error));
    }

    return new DendronEngineV2({
      wsRoot,
      vaults: ConfigUtils.getVaults(config),
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

  /**
   * @deprecated
   * For accessing a specific note by id, see {@link DendronEngineV2.getNote}.
   * If you need all notes, avoid modifying any note as this will cause unintended changes on the store side
   */
  get notes(): NotePropsByIdDict {
    return this.store.notes;
  }
  /**
   * @deprecated see {@link DendronEngineV2.findNotes}
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

  set notes(notes: NotePropsByIdDict) {
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
    return this.store.getNote(id);
  }

  /**
   * See {@link DEngine.findNotes}
   */
  async findNotes(opts: FindNoteOpts): Promise<NoteProps[]> {
    return this.store.findNotes(opts);
  }

  async bulkWriteNotes(opts: BulkWriteNotesOpts) {
    const changed = await this.store.bulkWriteNotes(opts);
    this.fuseEngine.updateNotesIndex(this.notes);
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
    } catch (err: any) {
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
    } catch (err: any) {
      return {
        error: err,
      };
    }
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

  async getSchema(id: string): Promise<RespV2<SchemaModuleProps>> {
    const ctx = "getSchema";
    const data = this.schemas[id];
    this.logger.info({ ctx, msg: "exit" });
    return {
      data,
      error: null,
    };
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

  queryNotesSync({
    qs,
    originalQS,
  }: {
    qs: string;
    originalQS: string;
  }): ReturnType<DEngineClient["queryNotesSync"]> {
    const items = this.fuseEngine.queryNote({ qs, originalQS });
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
    const { qs, vault, createIfNew, onlyDirectChildren, originalQS } = opts;

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

    const item = this.notes[items[0].id];
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
      await this.writeNote(noteNew, { newNode: true });
      this.fuseEngine.updateNotesIndex(this.notes);
    }
    this.logger.info({ ctx, msg: "exit" });
    let notes = items.map((ent) => this.notes[ent.id]);
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

  async renderNote({
    id,
    note,
    flavor,
    dest,
  }: RenderNoteOpts): Promise<RespV2<RenderNotePayload>> {
    const ctx = "DendronEngineV2:renderNote";

    // If provided, we render the given note entirely. Otherwise find the note in workspace.
    if (!note) {
      note = this.notes[id];
    } else {
      // `procRehype` needs the note to be in the engine, so we have to add it in case it's a dummy note
      this.store.updateNote(note);
    }

    // If note was not provided and we couldn't find it, we can't render.
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
    let data: string;
    try {
      data = await this._renderNote({
        note,
        flavor: flavor || ProcFlavor.PREVIEW,
        dest: dest || DendronASTDest.HTML,
      });
    } catch (error) {
      return ResponseUtil.createUnhappyResponse({
        error: new DendronError({
          message: `Unable to render note ${note.fname} in ${VaultUtils.getName(
            note.vault
          )}`,
          payload: error,
        }),
      });
    }

    this.renderedCache.set(id, {
      updated: note.updated,
      contentHash: note.contentHash,
      data,
    });

    const duration = milliseconds() - beforeRenderMillis;
    this.logger.info({ ctx, id, duration, msg: `Render preview finished.` });

    if (NoteUtils.isFileId(note.id)) {
      // Dummy note, we should remove it once we're done rendering
      this.store.deleteNote(note.id);
    }

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
    if (note.contentHash !== cachedPreview.contentHash) {
      return false;
    }
    // TODO: Add another check to see if backlinks have changed

    return (
      cachedPreview.updated >=
      NoteUtils.getLatestUpdateTimeOfPreviewNoteTree({
        rootNote: note,
        notes: this.notes,
      })
    );
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
    if (dest === DendronASTDest.HTML) {
      proc = MDUtilsV5.procRehypeFull(
        {
          engine: this,
          fname: note.fname,
          vault: note.vault,
          config: this.config,
        },
        { flavor }
      );
    } else {
      proc = MDUtilsV5.procRemarkFull(
        {
          engine: this,
          fname: note.fname,
          vault: note.vault,
          dest,
        },
        { flavor }
      );
    }
    const payload = await proc.process(NoteUtils.serialize(note));
    const renderedNote = payload.toString();
    return renderedNote;
  }

  async sync(): Promise<never> {
    throw Error("sync not implemented");
  }

  async refreshNotes(opts: RefreshNotesOpts) {
    await this.refreshNotesV2(opts.notes);
    return { error: null };
  }

  async refreshNotesV2(notes: NoteChangeEntry[]) {
    await Promise.all(
      notes.map(async (ent: NoteChangeEntry) => {
        if (ent.status === "delete") {
          NoteDictsUtils.delete(ent.note, {
            notesById: this.notes,
            notesByFname: this.noteFnames,
          });
        } else {
          const note = await EngineUtils.refreshNoteLinksAndAnchors({
            note: ent.note,
            engine: this,
          });
          this.store.updateNote(note);
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
   * TODO: this should return a ERROR
   * See {@link FileStorageV2.updateNote}
   * @param note
   * @param opts
   * @returns
   */
  async updateNote(note: NoteProps, opts?: EngineUpdateNodesOptsV2) {
    const ctx = "updateNote";
    this.logger.debug({ ctx, msg: "enter", note: NoteUtils.toNoteLoc(note) });
    const engine = this as DEngineClient;
    try {
      const noteWithLinks = await EngineUtils.refreshNoteLinksAndAnchors({
        note,
        engine,
      });
      this.logger.debug({ ctx, msg: "post:refreshed note links and anchors" });
      const out = this.store.updateNote(noteWithLinks, opts);
      this.logger.debug({ ctx, msg: "post:updateNote" });
      await this.updateIndex("note");
      this.logger.debug({ ctx, msg: "post:updateIndex" });
      return out;
    } catch (err) {
      this.logger.error({ ctx, msg: error2PlainObject(err as Error) });
      throw err;
    }
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
    const noteWithLinks = await EngineUtils.refreshNoteLinksAndAnchors({
      note,
      engine: this,
    });
    const out = await this.store.writeNote(noteWithLinks, opts);
    this.fuseEngine.updateNotesIndex(this.notes);
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
    } catch (err: any) {
      return {
        error: err,
        data: undefined,
      };
    }
  }

  async getDecorations(
    opts: GetDecorationsOpts
  ): Promise<GetDecorationsPayload> {
    const note = this.notes[opts.id];
    try {
      if (_.isUndefined(note))
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `${opts.id} does not exist`,
        });
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
      const {
        allDecorations: decorations,
        allDiagnostics: diagnostics,
        allErrors: errors,
      } = await runAllDecorators({ ...opts, note, engine: this });
      let error: IDendronError | null = null;
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
        data: undefined,
      };
    }
  }
}

export const createEngine = ({ wsRoot }: WorkspaceOpts) => {
  const engine = DendronEngineV2.create({ wsRoot });
  return engine as DEngineClient;
};
