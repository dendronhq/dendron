import {
  BulkWriteNotesOpts,
  Cache,
  ConfigUtils,
  DendronASTDest,
  DendronCompositeError,
  DendronError,
  DEngine,
  DEngineClient,
  DeleteSchemaResp,
  DEngineInitResp,
  DEngineMode,
  DHookDict,
  DNodeType,
  DStore,
  DVault,
  EngineSchemaWriteOpts,
  EngineDeleteOpts,
  EngineInfoResp,
  EngineWriteOptsV2,
  error2PlainObject,
  ERROR_SEVERITY,
  ERROR_STATUS,
  FindNoteOpts,
  FuseEngine,
  GetDecorationsOpts,
  GetDecorationsResp,
  GetNoteBlocksOpts,
  GetNoteBlocksResp,
  IDendronError,
  IntermediateDendronConfig,
  LruCache,
  milliseconds,
  newRange,
  NoteChangeEntry,
  NoteDictsUtils,
  NoteProps,
  NotePropsByIdDict,
  NotePropsMeta,
  QueryNotesResp,
  NoteUtils,
  NullCache,
  QueryNotesOpts,
  RenameNoteOpts,
  RenderNoteOpts,
  SchemaModuleDict,
  SchemaModuleProps,
  QuerySchemaResp,
  StatusCodes,
  stringifyError,
  VaultUtils,
  WorkspaceOpts,
  WriteNoteResp,
  BulkGetNoteResp,
  BulkGetNoteMetaResp,
  RenameNoteResp,
  RenderNoteResp,
  GetSchemaResp,
  GetNoteMetaResp,
  GetNoteResp,
  isNotUndefined,
} from "@dendronhq/common-all";
import {
  createLogger,
  DConfig,
  DLogger,
  NodeJSUtils,
} from "@dendronhq/common-server";
import _ from "lodash";
import { EngineUtils } from ".";
import { FileStorage } from "./drivers/file/storev2";
import {
  MDUtilsV5,
  ProcFlavor,
  runAllDecorators,
  RemarkUtils,
  getParsingDependencyDicts,
} from "@dendronhq/unified";
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
  public logger: DLogger;
  public fuseEngine: FuseEngine;
  public hooks: DHookDict;
  private _vaults: DVault[];
  private renderedCache: Cache<string, CachedPreview>;
  private schemas: SchemaModuleDict;

  static _instance: DendronEngineV2 | undefined;

  constructor(props: DendronEnginePropsV2) {
    this.wsRoot = props.wsRoot;
    this.logger = props.logger;
    this.fuseEngine = new FuseEngine({
      fuzzThreshold: ConfigUtils.getLookup(props.config).note.fuzzThreshold,
    });
    this._vaults = props.vaults;
    this.store = props.createStore(this);
    const hooks: DHookDict = ConfigUtils.getWorkspace(props.config).hooks || {
      onCreate: [],
    };
    this.hooks = hooks;
    this.renderedCache = createRenderedCache(props.config, this.logger);
    this.schemas = {};
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
          config,
        }),
      mode: "fuzzy",
      logger: LOGGER,
      config,
    });
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
    const ctx = "Engine:init";
    const defaultResp = {
      notes: {},
      schemas: {},
      wsRoot: this.wsRoot,
      vaults: this.vaults,
      config: ConfigUtils.genDefaultConfig(),
    };
    try {
      this.logger.info({ ctx, msg: "enter" });
      const { data, error: storeError } = await this.store.init();
      if (_.isUndefined(data)) {
        this.logger.error({ ctx, msg: "store init error", error: storeError });
        return {
          data: defaultResp,
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.UNKNOWN,
            severity: ERROR_SEVERITY.FATAL,
          }),
        };
      }
      const { notes, schemas } = data;
      await this.updateIndex("note");

      // Set schemas locally in the engine:
      this.schemas = schemas;
      await this.updateIndex("schema");
      this.logger.error({ ctx, msg: "updated index" });
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
      this.logger.info({ ctx, msg: "initialize hooks" });
      const allErrors = (_.isUndefined(storeError) ? [] : [storeError]).concat(
        hookErrors
      );
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

      this.logger.info({ ctx: "init:ext", error, storeError, hookErrors });

      return {
        error,
        data: {
          notes,
          wsRoot: this.wsRoot,
          vaults: this.vaults,
          config: DConfig.readConfigSync(this.wsRoot),
        },
      };
    } catch (error: any) {
      this.logger.error({
        ctx,
        msg: "caught error",
        error: error2PlainObject(error),
      });
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
   * See {@link DEngine.getNote}
   */
  async getNote(id: string): Promise<GetNoteResp> {
    return this.store.getNote(id);
  }

  async getNoteMeta(id: string): Promise<GetNoteMetaResp> {
    return this.getNote(id);
  }

  async bulkGetNotes(ids: string[]): Promise<BulkGetNoteResp> {
    return {
      data: ids.map((id) => {
        return this.notes[id];
      }),
    };
  }

  async bulkGetNotesMeta(ids: string[]): Promise<BulkGetNoteMetaResp> {
    return this.bulkGetNotes(ids);
  }

  /**
   * See {@link DEngine.findNotes}
   */
  async findNotes(opts: FindNoteOpts): Promise<NoteProps[]> {
    return this.store.findNotes(opts);
  }

  /**
   * See {@link DEngine.findNotesMeta}
   */
  async findNotesMeta(opts: FindNoteOpts): Promise<NotePropsMeta[]> {
    return this.findNotes(opts);
  }

  async bulkWriteNotes(opts: BulkWriteNotesOpts) {
    const changed = await this.store.bulkWriteNotes(opts);
    this.fuseEngine.replaceNotesIndex(this.notes);
    return changed;
  }

  async deleteNote(
    id: string,
    opts?: EngineDeleteOpts
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
    opts?: EngineDeleteOpts
  ): Promise<DeleteSchemaResp> {
    const data = (await this.store.deleteSchema(id, opts)) as DeleteSchemaResp;
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
  }

  async getSchema(id: string): Promise<GetSchemaResp> {
    const maybeSchema = await this.store.getSchema(id);

    if (!maybeSchema.data) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `SchemaModuleProps not found for key ${id}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
    return maybeSchema;
  }

  async info(): Promise<EngineInfoResp> {
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
      data: items.map((ent) => this.notes[ent.id]),
    };
  }

  async querySchema(queryString: string): Promise<QuerySchemaResp> {
    const ctx = "querySchema";

    let items: SchemaModuleProps[] = [];
    const results = await this.fuseEngine.querySchema({ qs: queryString });
    items = results.map((ent) => this.schemas[ent.id]).filter(isNotUndefined);
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
      data: items,
    };
  }

  async queryNotes(opts: QueryNotesOpts): Promise<QueryNotesResp> {
    const ctx = "Engine:queryNotes";
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
      return { data: [] };
    }

    this.logger.info({ ctx, msg: "exit" });
    let notes = items.map((ent) => this.notes[ent.id]);
    if (!_.isUndefined(vault)) {
      notes = notes.filter((ent) => {
        return VaultUtils.isEqual(vault, ent.vault, this.wsRoot);
      });
    }
    return {
      data: notes,
    };
  }

  async renderNote({
    id,
    note,
    flavor,
    dest,
  }: RenderNoteOpts): Promise<RenderNoteResp> {
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
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `${id} does not exist`,
          code: StatusCodes.BAD_REQUEST,
        }),
      };
    }

    const cachedPreview = this.renderedCache.get(id);
    if (cachedPreview) {
      if (this.isCachedPreviewUpToDate(cachedPreview, note)) {
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

    return { data };
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
    const config = DConfig.readConfigSync(this.wsRoot);

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
          vaults: this._vaults,
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
          vaults: this._vaults,
          wsRoot: this.wsRoot,
        },
        { flavor }
      );
    }
    const payload = await proc.process(NoteUtils.serialize(note));
    const renderedNote = payload.toString();
    return renderedNote;
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
          await EngineUtils.refreshNoteLinksAndAnchors({
            note: ent.note,
            engine: this,
            config: DConfig.readConfigSync(this.wsRoot),
          });
          this.store.updateNote(ent.note);
        }
      })
    );
    this.fuseEngine.replaceNotesIndex(this.notes);
  }

  async renameNote(opts: RenameNoteOpts): Promise<RenameNoteResp> {
    try {
      const resp = await this.store.renameNote(opts);
      await this.refreshNotesV2(resp);
      return {
        data: resp,
      };
    } catch (err: any) {
      let error = err;
      if (err instanceof DendronError) error = error2PlainObject(err);
      if (_.isUndefined(err.message)) err.message = "rename error";
      return { error };
    }
  }

  async updateIndex(mode: DNodeType) {
    if (mode === "schema") {
      this.fuseEngine.replaceSchemaIndex(this.schemas);
    } else {
      this.fuseEngine.replaceNotesIndex(this.notes);
    }
  }

  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const out = await this.store.writeNote(note, opts);
    this.fuseEngine.replaceNotesIndex(this.notes);
    return out;
  }

  async writeSchema(schema: SchemaModuleProps, opts?: EngineSchemaWriteOpts) {
    const out = this.store.writeSchema(schema, opts);
    await this.updateIndex("schema");
    return out;
  }

  async getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksResp> {
    const note = this.notes[opts.id];
    try {
      if (_.isUndefined(note))
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_STATE,
          message: `${opts.id} does not exist`,
        });
      const blocks = await RemarkUtils.extractBlocks({
        note,
        config: DConfig.readConfigSync(this.wsRoot, true),
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
      const config = DConfig.readConfigSync(this.wsRoot, true);
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
}

export const createEngine = ({ wsRoot }: WorkspaceOpts) => {
  const engine = DendronEngineV2.create({ wsRoot });
  return engine as DEngineClient;
};
