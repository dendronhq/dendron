import {
  APIUtils,
  BulkWriteNotesOpts,
  ConfigUtils,
  DendronAPI,
  DendronError,
  DEngineClient,
  DEngineDeleteSchemaResp,
  DEngineInitResp,
  DHookDict,
  DVault,
  EngineDeleteNoteResp,
  EngineDeleteOpts,
  EngineInfoResp,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  ERROR_SEVERITY,
  Event,
  EventEmitter,
  FuseEngine,
  GetAnchorsRequest,
  GetDecorationsOpts,
  GetDecorationsPayload,
  GetLinksRequest,
  GetNoteAnchorsPayload,
  GetNoteBlocksOpts,
  GetNoteBlocksPayload,
  GetNoteLinksPayload,
  NoteChangeEntry,
  NoteFnameDictUtils,
  NoteDictsUtils,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NoteUtils,
  Optional,
  QueryNotesOpts,
  RenameNoteOpts,
  RenameNotePayload,
  RenderNoteOpts,
  RespV2,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaQueryResp,
  SchemaUtils,
  VaultUtils,
  WriteNoteResp,
  FindNoteOpts,
  NotePropsMeta,
  UpdateNoteResp,
  RespV3,
  ERROR_STATUS,
  EngineEventEmitter,
  NoteIndexProps,
} from "@dendronhq/common-all";
import { createLogger, DLogger } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { DConfig } from "./config";
import { FileStorage } from "./drivers/file/storev2";
import {
  NoteIndexLightProps,
  SQLiteMetadataStore,
} from "./drivers/SQLiteMetadataStore";
import { HistoryService } from "./history";
import { EngineUtils } from "./utils";

type DendronEngineClientOpts = {
  vaults: DVault[];
  ws: string;
};

export class DendronEngineClient implements DEngineClient, EngineEventEmitter {
  private _onNoteChangedEmitter = new EventEmitter<NoteChangeEntry[]>();

  public notes: NotePropsByIdDict;
  public noteFnames: NotePropsByFnameDict;
  public wsRoot: string;
  public schemas: SchemaModuleDict;
  public ws: string;
  public fuseEngine: FuseEngine;
  public api: DendronAPI;
  public vaults: DVault[];
  public history?: HistoryService;
  public logger: DLogger;
  public store: FileStorage;
  public hooks: DHookDict;

  static create({
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
    return new DendronEngineClient({ api, vaults, ws, history });
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
  }: {
    api: DendronAPI;
    history?: HistoryService;
    logger?: DLogger;
  } & DendronEngineClientOpts) {
    this.api = api;
    this.notes = {};
    this.noteFnames = {};
    this.schemas = {};
    this.vaults = vaults;
    this.wsRoot = ws;
    this.ws = ws;
    this.history = history;
    this.logger = logger || createLogger();
    const config = DConfig.readConfigSync(ws);
    this.fuseEngine = new FuseEngine({
      fuzzThreshold: ConfigUtils.getLookup(config).note.fuzzThreshold,
    });
    this.store = new FileStorage({
      engine: this,
      logger: this.logger,
      config,
    });
    this.hooks = ConfigUtils.getWorkspace(config).hooks || {
      onCreate: [],
    };
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
        error: resp.error,
      };
    }
    if (!resp.data) {
      throw new DendronError({ message: "no data" });
    }
    const { notes, schemas, config } = resp.data;
    this.notes = notes;
    this.noteFnames = NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
    this.schemas = schemas;
    await this.fuseEngine.replaceNotesIndex(notes);
    await this.fuseEngine.replaceSchemaIndex(schemas);
    this.store.notes = notes;
    this.store.schemas = schemas;
    return {
      error: resp.error,
      data: {
        notes,
        config,
        schemas,
        wsRoot: this.wsRoot,
        vaults: this.vaults,
      },
    };
  }
  /**
   * See {@link DStore.getNote}
   */
  async getNote(id: string): Promise<RespV3<NoteProps>> {
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

  /**
   * See {@link DStore.findNotes}
   */
  async findNotes(opts: FindNoteOpts): Promise<NoteProps[]> {
    const { fname, vault } = opts;
    if (fname) {
      return _.cloneDeep(
        NoteDictsUtils.findByFname(
          fname,
          { notesById: this.notes, notesByFname: this.noteFnames },
          vault
        )
      );
    } else if (vault) {
      return _.cloneDeep(
        _.values(this.notes).filter((note) =>
          VaultUtils.isEqualV2(note.vault, vault)
        )
      );
    } else {
      return [];
    }
  }

  /**
   * See {@link DStore.findNotesMeta}
   * TODO: fix logic after engine refactor
   */
  async findNotesMeta(opts: FindNoteOpts): Promise<NotePropsMeta[]> {
    return this.findNotes(opts);
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
  ): Promise<EngineDeleteNoteResp> {
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
      error: null,
      data: resp.data,
    };
  }

  async deleteSchema(
    id: string,
    opts?: EngineDeleteOpts
  ): Promise<DEngineDeleteSchemaResp> {
    const ws = this.ws;
    const resp = await this.api.schemaDelete({ id, opts, ws });
    delete this.schemas[id];
    if (!resp?.data?.notes || !resp?.data?.schemas) {
      throw new DendronError({ message: "bad delete operation" });
    }
    const { notes, schemas } = resp.data;
    this.notes = notes;
    this.noteFnames = NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
    this.schemas = schemas;
    this.fuseEngine.replaceNotesIndex(notes);
    this.fuseEngine.replaceSchemaIndex(schemas);
    return {
      error: null,
      data: resp.data,
    };
  }

  async info(): Promise<RespV2<EngineInfoResp>> {
    const resp = await this.api.engineInfo();
    return resp;
  }

  async queryNote(
    opts: Parameters<DEngineClient["queryNotes"]>[0]
  ): Promise<NoteProps[]> {
    const { qs, onlyDirectChildren, vault, originalQS } = opts;
    let noteIndexProps: NoteIndexProps[] | NoteIndexLightProps[];
    const config = DConfig.readConfigSync(this.wsRoot);
    if (config.workspace.metadataStore === "sqlite") {
      try {
        const resp = await SQLiteMetadataStore.search(qs);
        noteIndexProps = resp.hits;
        this.logger.debug({ ctx: "queryNote", query: resp.query });
      } catch (err) {
        fs.appendFileSync("/tmp/out.log", "ERROR: unable to query note", {
          encoding: "utf8",
        });
        noteIndexProps = [];
      }
    } else {
      noteIndexProps = await this.fuseEngine.queryNote({
        qs,
        onlyDirectChildren,
        originalQS,
      });
    }
    let noteProps = noteIndexProps.map((ent) => this.notes[ent.id]);
    // TODO: hack
    if (!_.isUndefined(vault)) {
      noteProps = noteProps.filter((ent) =>
        VaultUtils.isEqual(vault, ent.vault, this.wsRoot)
      );
    }
    return noteProps;
  }

  async queryNotes(opts: QueryNotesOpts) {
    const items = await this.queryNote(opts);
    return {
      data: items,
      error: null,
    };
  }

  queryNotesSync({
    qs,
    originalQS,
    vault,
  }: {
    qs: string;
    originalQS: string;
    vault?: DVault;
  }) {
    let items = this.fuseEngine.queryNote({ qs, originalQS });
    if (vault) {
      items = items.filter((ent) => {
        return VaultUtils.isEqual(ent.vault, vault, this.wsRoot);
      });
    }
    return {
      error: null,
      data: items.map((ent) => this.notes[ent.id]),
    };
  }

  async renderNote(opts: RenderNoteOpts) {
    return this.api.noteRender({ ...opts, ws: this.ws });
  }

  async refreshNotesV2(notes: NoteChangeEntry[]) {
    if (_.isUndefined(notes)) {
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

  async refreshSchemas(smods: SchemaModuleProps[]) {
    smods.forEach((smod) => {
      const id = SchemaUtils.getModuleRoot(smod).id;
      this.schemas[id] = smod;
    });
  }

  /** Renames the note.
   *
   *  WARNING: When doing bulk operations. Do not invoke multiple requests to this
   *  command in parallel, wait for a single call to finish before requesting another call.
   *  Otherwise some race condition starts to cause intermittent failures.
   *  */
  async renameNote(opts: RenameNoteOpts): Promise<RespV2<RenameNotePayload>> {
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
    const { notes, schemas, config } = resp.data;
    this.notes = notes;
    this.noteFnames = NoteFnameDictUtils.createNotePropsByFnameDict(this.notes);
    this.schemas = schemas;
    await this.fuseEngine.replaceNotesIndex(notes);
    await this.fuseEngine.replaceSchemaIndex(schemas);
    return {
      error: resp.error,
      data: {
        notes,
        schemas,
        vaults: this.vaults,
        wsRoot: this.wsRoot,
        config,
      },
    };
  }

  async updateNote(
    note: NoteProps,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<UpdateNoteResp> {
    const resp = await this.api.engineUpdateNote({ ws: this.ws, note, opts });
    if (resp.error || !resp.data) {
      return resp;
    }

    await this.refreshNotesV2(resp.data);

    this._onNoteChangedEmitter.fire(resp.data);

    return resp;
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
  async getSchema(id: string): Promise<RespV3<SchemaModuleProps>> {
    const maybeSchema = this.schemas[id];

    if (maybeSchema) {
      return { data: _.cloneDeep(maybeSchema) };
    } else {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.CONTENT_NOT_FOUND,
          message: `SchemaModuleProps not found for key ${id}.`,
          severity: ERROR_SEVERITY.MINOR,
        }),
      };
    }
  }

  async querySchema(qs: string): Promise<SchemaQueryResp> {
    const out = await this.api.schemaQuery({ qs, ws: this.ws });
    return _.defaults(out, { data: [] });
  }

  async updateSchema(schema: SchemaModuleProps): Promise<void> {
    await this.api.schemaUpdate({ schema, ws: this.ws });
    await this.refreshSchemas([schema]);
    return;
  }

  async writeSchema(schema: SchemaModuleProps): Promise<void> {
    await this.api.schemaWrite({ schema, ws: this.ws });
    await this.refreshSchemas([schema]);
    return;
  }

  async getNoteBlocks({
    id,
    filterByAnchorType,
  }: GetNoteBlocksOpts): Promise<GetNoteBlocksPayload> {
    const out = await this.api.getNoteBlocks({
      id,
      filterByAnchorType,
      ws: this.ws,
    });
    return out;
  }

  async getDecorations(
    opts: GetDecorationsOpts
  ): Promise<GetDecorationsPayload> {
    const out = await this.api.getDecorations({
      ...opts,
      ws: this.ws,
    });
    return out;
  }

  getAnchors(opts: GetAnchorsRequest): Promise<GetNoteAnchorsPayload> {
    return this.api.getAnchors(opts);
  }

  getLinks(
    opts: Optional<GetLinksRequest, "ws">
  ): Promise<GetNoteLinksPayload> {
    return this.api.getLinks({
      ws: this.ws,
      ...opts,
    });
  }
}
