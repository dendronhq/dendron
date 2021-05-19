import {
  BulkAddNoteOpts,
  ConfigGetPayload,
  ConfigWriteOpts,
  DendronConfig,
  DendronError,
  DEngine,
  DEngineClient,
  DEngineDeleteSchemaResp,
  DEngineInitResp,
  DHookDict,
  DLink,
  DNodeProps,
  DVault,
  EngineDeleteNoteResp,
  EngineDeleteOptsV2,
  EngineInfoResp,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  ERROR_SEVERITY,
  GetNoteOptsV2,
  GetNotePayload,
  NoteChangeEntry,
  NoteProps,
  NotePropsDict,
  NoteUtils,
  QueryNotesOpts,
  RenameNoteOpts,
  RenameNotePayload,
  RespRequired,
  RespV2,
  SchemaModuleDict,
  SchemaModuleProps,
  SchemaQueryResp,
  SchemaUtils,
  VaultUtils,
  WriteNoteResp,
} from "@dendronhq/common-all";
import {
  createLogger,
  DendronAPI,
  DLogger,
  readYAML,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { DConfig } from "./config";
import { FileStorage } from "./drivers/file/storev2";
import { FuseEngine } from "./fuseEngine";
import { HistoryService } from "./history";
import { getPortFilePath } from "./utils";

type DendronEngineClientOpts = {
  vaults: DVault[];
  ws: string;
};

export class DendronEngineClient implements DEngineClient {
  public notes: NotePropsDict;
  public wsRoot: string;
  public schemas: SchemaModuleDict;
  public links: DLink[];
  public ws: string;
  public fuseEngine: FuseEngine;
  public api: DendronAPI;
  public vaults: DVault[];
  public configRoot: string;
  public history?: HistoryService;
  public logger: DLogger;
  public store: FileStorage;
  public config: DendronConfig;
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
      endpoint: `http://localhost:${port}`,
      apiPath: "api",
      logger,
    });
    return new DendronEngineClient({ api, vaults, ws, history });
  }

  static getPort({ wsRoot }: { wsRoot: string }): number {
    const portFile = getPortFilePath({ wsRoot });
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
    this.schemas = {};
    this.links = [];
    this.fuseEngine = new FuseEngine({});
    this.vaults = vaults;
    this.wsRoot = ws;
    this.ws = ws;
    this.configRoot = this.wsRoot;
    this.history = history;
    this.logger = logger || createLogger();
    const cpath = DConfig.configPath(ws);
    this.config = readYAML(cpath) as DendronConfig;
    this.store = new FileStorage({
      engine: this,
      logger: this.logger,
    });
    this.hooks = this.config.hooks || { onCreate: [] };
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
    const { notes, schemas } = resp.data;
    this.notes = notes;
    this.schemas = schemas;
    await this.fuseEngine.updateNotesIndex(notes);
    await this.fuseEngine.updateSchemaIndex(schemas);
    this.store.notes = notes;
    this.store.schemas = schemas;
    return {
      error: resp.error,
      data: {
        notes,
        schemas,
        config: this.config,
        wsRoot: this.wsRoot,
        vaults: this.vaults,
      },
    };
  }

  async bulkAddNotes(opts: BulkAddNoteOpts) {
    const resp = await this.api.engineBulkAdd({ opts, ws: this.ws });
    let changed = resp.data;
    await this.refreshNotesV2(changed);
    return resp;
  }

  async deleteNote(
    id: string,
    opts?: EngineDeleteOptsV2
  ): Promise<EngineDeleteNoteResp> {
    const ws = this.ws;
    const resp = await this.api.engineDelete({ id, opts, ws });
    if (!resp.data) {
      throw new DendronError({ message: "no data" });
    }
    await this.refreshNotesV2(resp.data);
    return {
      error: null,
      data: resp.data,
    };
  }

  async deleteSchema(
    id: string,
    opts?: EngineDeleteOptsV2
  ): Promise<DEngineDeleteSchemaResp> {
    const ws = this.ws;
    const resp = await this.api.schemaDelete({ id, opts, ws });
    delete this.schemas[id];
    if (!resp?.data?.notes || !resp?.data?.schemas) {
      throw new DendronError({ message: "bad delete operation" });
    }
    const { notes, schemas } = resp.data;
    this.notes = notes;
    this.schemas = schemas;
    this.fuseEngine.updateNotesIndex(notes);
    this.fuseEngine.updateSchemaIndex(schemas);
    return {
      error: null,
      data: resp.data,
    };
  }

  async getConfig(): Promise<RespV2<ConfigGetPayload>> {
    const resp = await this.api.configGet({
      ws: this.ws,
    });
    return resp;
  }

  async getNoteByPath(opts: GetNoteOptsV2): Promise<RespV2<GetNotePayload>> {
    const resp = await this.api.engineGetNoteByPath({
      ...opts,
      ws: this.ws,
    });
    if (!_.isUndefined(resp.data)) {
      await this.refreshNotesV2(resp.data.changed);
    }
    return resp;
  }

  async info(): Promise<RespRequired<EngineInfoResp>> {
    const resp = await this.api.engineInfo();
    return resp;
  }

  async queryNote(
    opts: Parameters<DEngineClient["queryNotes"]>[0]
  ): Promise<NoteProps[]> {
    const { qs, vault } = opts;
    let noteIndexProps = await this.fuseEngine.queryNote({ qs });
    // TODO: hack
    if (!_.isUndefined(vault)) {
      noteIndexProps = noteIndexProps.filter((ent) =>
        VaultUtils.isEqual(vault, ent.vault, this.wsRoot)
      );
    }
    return noteIndexProps.map((ent) => this.notes[ent.id]);
  }

  async queryNotes(opts: QueryNotesOpts) {
    const items = await this.queryNote(opts);
    return {
      data: items,
      error: null,
    };
  }

  async buildNotes() {}

  queryNotesSync({ qs, vault }: { qs: string; vault?: DVault }) {
    let items = this.fuseEngine.queryNote({ qs });
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

  async refreshNotes(notes: NoteProps[]) {
    notes.forEach((node: DNodeProps) => {
      const { id } = node;
      this.notes[id] = node;
    });
    this.fuseEngine.updateNotesIndex(this.notes);
  }

  async refreshNotesV2(notes: NoteChangeEntry[]) {
    notes.forEach((ent: NoteChangeEntry) => {
      const { id } = ent.note;
      const uri = NoteUtils.getURI({ note: ent.note, wsRoot: this.wsRoot });
      if (ent.status === "delete") {
        delete this.notes[id];
        this.history &&
          this.history.add({ source: "engine", action: "delete", uri });
      } else {
        if (ent.status === "create") {
          this.history &&
            this.history.add({ source: "engine", action: "create", uri });
        }
        if (ent.status === "update") {
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
        this.notes[id] = ent.note;
      }
    });
    this.fuseEngine.updateNotesIndex(this.notes);
  }

  async refreshSchemas(smods: SchemaModuleProps[]) {
    smods.forEach((smod) => {
      const id = SchemaUtils.getModuleRoot(smod).id;
      this.schemas[id] = smod;
    });
  }

  async renameNote(opts: RenameNoteOpts): Promise<RespV2<RenameNotePayload>> {
    const resp = await this.api.engineRenameNote({ ...opts, ws: this.ws });
    await this.refreshNotesV2(resp.data as NoteChangeEntry[]);
    return resp;
  }

  async sync(): Promise<DEngineInitResp> {
    const resp = await this.api.workspaceSync({ ws: this.ws });
    if (!resp.data) {
      throw new DendronError({ message: "no data", payload: resp });
    }
    const { notes, schemas } = resp.data;
    this.notes = notes;
    this.schemas = schemas;
    await this.fuseEngine.updateNotesIndex(notes);
    await this.fuseEngine.updateSchemaIndex(schemas);
    return {
      error: resp.error,
      data: {
        notes,
        schemas,
        vaults: this.vaults,
        wsRoot: this.wsRoot,
        config: this.config,
      },
    };
  }

  async updateNote(note: NoteProps, opts?: EngineUpdateNodesOptsV2) {
    const resp = await this.api.engineUpdateNote({ ws: this.ws, note, opts });
    const noteClean = resp.data;
    if (_.isUndefined(noteClean)) {
      throw new DendronError({ message: "error updating note", payload: resp });
    }
    await this.refreshNotes([noteClean]);
    return noteClean;
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
    let changed = resp.data;
    if (resp.error) {
      return resp;
    }
    // we are updating in place, remove deletes
    if (opts?.updateExisting) {
      changed = _.reject(changed, (ent) => ent.status === "delete");
    }
    await this.refreshNotesV2(changed);
    return resp;
  }

  // ~~~ schemas
  async getSchema(_qs: string): Promise<RespV2<SchemaModuleProps>> {
    throw Error("not implemetned");
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

  async writeConfig(opts: ConfigWriteOpts): ReturnType<DEngine["writeConfig"]> {
    await this.api.configWrite({ ...opts, ws: this.ws });
    return {
      error: null,
    };
  }

  async writeSchema(schema: SchemaModuleProps): Promise<void> {
    await this.api.schemaWrite({ schema, ws: this.ws });
    await this.refreshSchemas([schema]);
    return;
  }
}
