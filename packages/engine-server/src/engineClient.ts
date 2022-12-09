import {
  APIUtils,
  BulkGetNoteMetaResp,
  BulkGetNoteResp,
  BulkWriteNotesOpts,
  ConfigUtils,
  DeleteNoteResp,
  DeleteSchemaResp,
  DendronAPI,
  DendronError,
  DEngineClient,
  DEngineInitResp,
  DHookDict,
  DVault,
  EngineDeleteOpts,
  EngineEventEmitter,
  EngineInfoResp,
  EngineSchemaWriteOpts,
  EngineWriteOptsV2,
  ERROR_SEVERITY,
  ERROR_STATUS,
  Event,
  EventEmitter,
  FindNoteOpts,
  FuseEngine,
  GetDecorationsOpts,
  GetDecorationsResp,
  GetNoteBlocksOpts,
  GetNoteBlocksResp,
  GetNoteMetaResp,
  GetNoteResp,
  GetSchemaResp,
  NoteChangeEntry,
  NoteDictsUtils,
  NoteFnameDictUtils,
  NoteIndexProps,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  NoteUtils,
  QueryNotesOpts,
  QuerySchemaResp,
  RenameNoteOpts,
  RenameNoteResp,
  RenderNoteOpts,
  SchemaModuleProps,
  VaultUtils,
  WriteNoteResp,
  WriteSchemaResp,
  QueryNotesResp,
  ConfigService,
  DendronConfig,
  URI,
  QueryNotesMetaResp,
} from "@dendronhq/common-all";
import { createLogger, DLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import {
  NoteIndexLightProps,
  SQLiteMetadataStore,
} from "./drivers/PrismaSQLiteMetadataStore";
import { HistoryService } from "./history";
import { EngineUtils } from "./utils";

type DendronEngineClientOpts = {
  vaults: DVault[];
  ws: string;
};

export class DendronEngineClient implements DEngineClient, EngineEventEmitter {
  private _onNoteChangedEmitter = new EventEmitter<NoteChangeEntry[]>();
  private _config;

  public notes: NotePropsByIdDict;
  public noteFnames: NotePropsByFnameDict;
  public wsRoot: string;
  public ws: string;
  public fuseEngine: FuseEngine;
  public api: DendronAPI;
  public vaults: DVault[];
  public history?: HistoryService;
  public logger: DLogger;
  public hooks: DHookDict;

  static async create({
    port,
    vaults,
    ws,
    history,
    logger,
  }: {
    port: number | string;
    history?: HistoryService;
    logger?: DLogger;
  } & DendronEngineClientOpts) {
    const api = new DendronAPI({
      endpoint: APIUtils.getLocalEndpoint(
        _.isString(port) ? parseInt(port, 10) : port
      ),
      apiPath: "api",
      logger,
    });
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(ws)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;
    return new DendronEngineClient({ api, vaults, ws, history, config });
  }

  static getPort({ wsRoot }: { wsRoot: string }): number {
    const portFile = EngineUtils.getPortFilePathForWorkspace({ wsRoot });
    if (!fs.pathExistsSync(portFile)) {
      throw new DendronError({ message: "no port file" });
    }
    return _.toInteger(_.trim(fs.readFileSync(portFile, { encoding: "utf8" })));
  }

  constructor({
    api,
    vaults,
    ws,
    history,
    logger,
    config,
  }: {
    api: DendronAPI;
    history?: HistoryService;
    logger?: DLogger;
    config: DendronConfig;
  } & DendronEngineClientOpts) {
    this.api = api;
    this.notes = {};
    this.noteFnames = {};
    this.vaults = vaults;
    this.wsRoot = ws;
    this.ws = ws;
    this.history = history;
    this.logger = logger || createLogger();
    this.fuseEngine = new FuseEngine({
      fuzzThreshold: ConfigUtils.getLookup(config).note.fuzzThreshold,
    });
    this.hooks = ConfigUtils.getWorkspace(config).hooks || {
      onCreate: [],
    };
    this._config = config;
  }

  /**
   * Event that fires upon the changing of note state in the engine after a set
   * of NoteProps has been changed AND those changes have been reflected on the
   * engine side. Note creation, deletion, and updates are all fired from this
   * event.
   */
  get onEngineNoteStateChanged(): Event<NoteChangeEntry[]> {
    return this._onNoteChangedEmitter.event;
  }

  dispose() {
    this._onNoteChangedEmitter.dispose();
  }
  /**
   * Load all nodes
   */
  async init(): Promise<DEngineInitResp> {
    const resp = await this.api.workspaceInit({
      uri: this.ws,
      config: { vaults: this.vaults },
    });

    if (resp.error && resp.error.severity !== ERROR_SEVERITY.MINOR) {
      return {
        data: resp.data,
        error: resp.error,
      };
    }
    if (!resp.data) {
      // TODO SQLite - sqlite impl doesn't return data from init; eventually no
      // implementations should. To converge later
      if (this._config.dev?.useSqlite) {
        return {} as DEngineInitResp;
      } else {
        throw new DendronError({ message: "no data" });
      }
    }
    const { notes, config } = resp.data;
    this._config = config;
    this.notes = notes;
    this.noteFnames = NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
    await this.fuseEngine.replaceNotesIndex(notes);
    return {
      error: resp.error,
      data: {
        notes,
        config,
        wsRoot: this.wsRoot,
        vaults: this.vaults,
      },
    };
  }
  /**
   * See {@link DStore.getNote}
   */
  async getNote(id: string): Promise<GetNoteResp> {
    if (this._config.dev?.enableEngineV3) {
      return this.api.noteGet({ id, ws: this.ws });
    } else {
      const maybeNote = this.notes[id];

      if (maybeNote) {
        return { data: _.cloneDeep(maybeNote) };
      } else {
        return {
          error: DendronError.createFromStatus({
            status: ERROR_STATUS.CONTENT_NOT_FOUND,
            message: `NoteProps not found for key ${id}.`,
            severity: ERROR_SEVERITY.MINOR,
          }),
        };
      }
    }
  }

  async getNoteMeta(id: string): Promise<GetNoteMetaResp> {
    if (this._config.dev?.enableEngineV3) {
      return this.api.noteGetMeta({ id, ws: this.ws });
    } else {
      return this.getNote(id);
    }
  }

  /**
   * See {@link DEngine.bulkGetNotes}
   * TODO: remove this.notes
   */
  async bulkGetNotes(ids: string[]): Promise<BulkGetNoteResp> {
    if (this._config.dev?.enableEngineV3) {
      return this.api.noteBulkGet({ ids, ws: this.ws });
    } else {
      return {
        data: ids.map((id) => {
          return _.cloneDeep(this.notes[id]);
        }),
      };
    }
  }

  /**
   * See {@link DEngine.bulkGetNotesMeta}
   * TODO: remove this.notes
   */
  async bulkGetNotesMeta(ids: string[]): Promise<BulkGetNoteMetaResp> {
    if (this._config.dev?.enableEngineV3) {
      return this.api.noteBulkGetMeta({ ids, ws: this.ws });
    } else {
      return this.bulkGetNotes(ids);
    }
  }

  /**
   * See {@link DStore.findNotes}
   */
  async findNotes(opts: FindNoteOpts): Promise<NoteProps[]> {
    const resp = await this.api.noteFind({ ...opts, ws: this.ws });
    return resp.data!;
  }

  /**
   * See {@link DStore.findNotesMeta}
   */
  async findNotesMeta(opts: FindNoteOpts): Promise<NotePropsMeta[]> {
    const resp = await this.api.noteFindMeta({ ...opts, ws: this.ws });
    return resp.data!;
  }

  async bulkWriteNotes(opts: BulkWriteNotesOpts) {
    const resp = await this.api.engineBulkAdd({ opts, ws: this.ws });
    const changed = resp.data;

    if (changed) {
      await this.refreshNotesV2(changed);
      this._onNoteChangedEmitter.fire(changed);
    }

    return resp;
  }

  async deleteNote(
    id: string,
    opts?: EngineDeleteOpts
  ): Promise<DeleteNoteResp> {
    const ws = this.ws;
    const resp = await this.api.engineDelete({ id, opts, ws });
    if (!resp.data) {
      throw new DendronError({
        message: `Failed to delete note with id ${id}`,
        payload: resp.error,
      });
    }
    await this.refreshNotesV2(resp.data);

    if (resp.data !== undefined) {
      this._onNoteChangedEmitter.fire(resp.data);
    }

    return {
      data: resp.data,
    };
  }

  async deleteSchema(
    id: string,
    opts?: EngineDeleteOpts
  ): Promise<DeleteSchemaResp> {
    const ws = this.ws;
    const resp = await this.api.schemaDelete({ id, opts, ws });
    if (!resp?.data?.notes) {
      throw new DendronError({ message: "bad delete operation" });
    }
    const { notes } = resp.data;
    this.notes = notes;
    this.noteFnames = NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
    this.fuseEngine.replaceNotesIndex(notes);
    return {
      data: resp.data,
    };
  }

  async info(): Promise<EngineInfoResp> {
    const resp = await this.api.engineInfo();
    return resp;
  }

  async queryNotes(opts: QueryNotesOpts): Promise<QueryNotesResp> {
    const { qs, onlyDirectChildren, vault, originalQS } = opts;
    let noteIndexProps: NoteIndexProps[] | NoteIndexLightProps[];
    let noteProps: NoteProps[];

    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(this.wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;
    if (config.workspace.metadataStore === "sqlite") {
      try {
        const resp = await SQLiteMetadataStore.search(qs);
        noteIndexProps = resp.hits;
        noteProps = noteIndexProps.map((ent) => this.notes[ent.id]);
        // TODO: hack
        if (!_.isUndefined(vault)) {
          noteProps = noteProps.filter((ent) =>
            VaultUtils.isEqual(vault, ent.vault, this.wsRoot)
          );
        }
        this.logger.debug({ ctx: "queryNote", query: resp.query });
      } catch (err) {
        fs.appendFileSync("/tmp/out.log", "ERROR: unable to query note", {
          encoding: "utf8",
        });
        noteProps = [];
      }
    } else if (this._config.dev?.enableEngineV3) {
      noteProps = (
        await this.api.noteQuery({
          opts,
          ws: this.wsRoot,
        })
      ).data!;
    } else {
      noteIndexProps = this.fuseEngine.queryNote({
        qs,
        onlyDirectChildren,
        originalQS,
      });
      noteProps = noteIndexProps.map((ent) => this.notes[ent.id]);
      // TODO: hack
      if (!_.isUndefined(vault)) {
        noteProps = noteProps.filter((ent) =>
          VaultUtils.isEqual(vault, ent.vault, this.wsRoot)
        );
      }
    }
    return noteProps;
  }

  async queryNotesMeta(opts: QueryNotesOpts): Promise<QueryNotesMetaResp> {
    const { qs, onlyDirectChildren, vault, originalQS } = opts;
    let noteIndexProps: NoteIndexProps[] | NoteIndexLightProps[];
    let noteProps: NotePropsMeta[];
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(this.wsRoot)
    );
    if (configReadResult.isErr()) {
      throw configReadResult.error;
    }
    const config = configReadResult.value;
    if (config.workspace.metadataStore === "sqlite") {
      try {
        const resp = await SQLiteMetadataStore.search(qs);
        noteIndexProps = resp.hits;
        noteProps = noteIndexProps.map((ent) => this.notes[ent.id]);
        // TODO: hack
        if (!_.isUndefined(vault)) {
          noteProps = noteProps.filter((ent) =>
            VaultUtils.isEqual(vault, ent.vault, this.wsRoot)
          );
        }
        this.logger.debug({ ctx: "queryNote", query: resp.query });
      } catch (err) {
        fs.appendFileSync("/tmp/out.log", "ERROR: unable to query note", {
          encoding: "utf8",
        });
        noteProps = [];
      }
    } else if (this._config.dev?.enableEngineV3) {
      noteProps = (
        await this.api.noteQueryMeta({
          opts,
          ws: this.wsRoot,
        })
      ).data!;
    } else {
      noteIndexProps = this.fuseEngine.queryNote({
        qs,
        onlyDirectChildren,
        originalQS,
      });
      noteProps = noteIndexProps.map((ent) => this.notes[ent.id]);
      // TODO: hack
      if (!_.isUndefined(vault)) {
        noteProps = noteProps.filter((ent) =>
          VaultUtils.isEqual(vault, ent.vault, this.wsRoot)
        );
      }
    }
    return noteProps;
  }

  async renderNote(opts: RenderNoteOpts) {
    return this.api.noteRender({ ...opts, ws: this.ws });
  }

  async refreshNotesV2(notes: NoteChangeEntry[]) {
    // No-op for v3. TODO: remove after migration
    if (_.isUndefined(notes) || this._config.dev?.enableEngineV3) {
      return;
    }

    const noteDicts = {
      notesById: this.notes,
      notesByFname: this.noteFnames,
    };
    notes.forEach((ent: NoteChangeEntry) => {
      const uri = NoteUtils.getURI({ note: ent.note, wsRoot: this.wsRoot });
      if (ent.status === "delete") {
        NoteDictsUtils.delete(ent.note, noteDicts);
        this.history?.add({ source: "engine", action: "delete", uri });
      } else {
        if (ent.status === "create") {
          this.history?.add({ source: "engine", action: "create", uri });
        }
        if (ent.status === "update") {
          // If the note id has changed, delete previous entry from dict before adding
          if (ent.prevNote && ent.prevNote.id !== ent.note.id) {
            NoteDictsUtils.delete(ent.prevNote, noteDicts);
          }
          ent.note.children = _.sortBy(
            ent.note.children,
            (id) =>
              _.get(
                this.notes,
                id,
                _.find(notes, (ent) => ent.note.id === id)?.note || {
                  title: "foo",
                }
              ).title
          );
        }
        NoteDictsUtils.add(ent.note, noteDicts);
      }
    });
    this.fuseEngine.replaceNotesIndex(this.notes);
  }

  /** Renames the note.
   *
   *  WARNING: When doing bulk operations. Do not invoke multiple requests to this
   *  command in parallel, wait for a single call to finish before requesting another call.
   *  Otherwise some race condition starts to cause intermittent failures.
   *  */
  async renameNote(opts: RenameNoteOpts): Promise<RenameNoteResp> {
    const resp = await this.api.engineRenameNote({ ...opts, ws: this.ws });
    if (resp.error || _.isUndefined(resp.data)) {
      throw resp.error;
    }
    await this.refreshNotesV2(resp.data as NoteChangeEntry[]);

    if (resp.data) {
      this._onNoteChangedEmitter.fire(resp.data);
    }
    return resp;
  }

  async sync(): Promise<DEngineInitResp> {
    const resp = await this.api.workspaceSync({ ws: this.ws });
    if (!resp.data) {
      throw new DendronError({ message: "no data", payload: resp });
    }
    const { notes, config } = resp.data;
    this.notes = notes;
    this.noteFnames = NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
    await this.fuseEngine.replaceNotesIndex(notes);
    return {
      error: resp.error,
      data: {
        notes,
        vaults: this.vaults,
        wsRoot: this.wsRoot,
        config,
      },
    };
  }

  async writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const resp = await this.api.engineWrite({
      node: note,
      opts,
      ws: this.ws,
    });
    const changed = resp.data;
    if (resp.error) {
      return resp;
    }

    if (changed) {
      await this.refreshNotesV2(changed);
      this._onNoteChangedEmitter.fire(changed);
    }

    return resp;
  }

  // ~~~ schemas
  async getSchema(id: string): Promise<GetSchemaResp> {
    return this.api.schemaRead({ id, ws: this.ws });
  }

  async querySchema(qs: string): Promise<QuerySchemaResp> {
    const out = await this.api.schemaQuery({ qs, ws: this.ws });
    return _.defaults(out, { data: [] });
  }

  async writeSchema(
    schema: SchemaModuleProps,
    opts?: EngineSchemaWriteOpts
  ): Promise<WriteSchemaResp> {
    this.logger.debug({
      ctx: "engineClient.writeSchema",
      schema: schema.fname,
      metaOnly: opts?.metaOnly,
    });
    return this.api.schemaWrite({ schema, ws: this.ws, opts });
  }

  async getNoteBlocks({
    id,
    filterByAnchorType,
  }: GetNoteBlocksOpts): Promise<GetNoteBlocksResp> {
    const out = await this.api.getNoteBlocks({
      id,
      filterByAnchorType,
      ws: this.ws,
    });
    return out;
  }

  async getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsResp> {
    const out = await this.api.getDecorations({
      ...opts,
      ws: this.ws,
    });
    return out;
  }
}
