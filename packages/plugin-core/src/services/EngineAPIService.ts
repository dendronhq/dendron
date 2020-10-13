import {
  DendronError,
  DEngineClientV2,
  DEngineInitRespV2,
  DNodeData,
  DNodePropsV2,
  DNodeTypeV2,
  EngineDeleteOptsV2,
  EngineGetResp,
  EngineQueryNoteResp,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  GetNoteOptsV2,
  GetNotePayloadV2,
  NotePropsDictV2,
  NotePropsV2,
  QueryMode,
  QueryOneOpts,
  QueryOptsV2,
  RespV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaQueryResp,
  SchemaUtilsV2,
  WriteNoteResp,
} from "@dendronhq/common-all";
import { DendronAPI } from "@dendronhq/common-server";
import { FuseEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import path from "path";
import { Logger } from "../logger";
import { DendronWorkspace } from "../workspace";

export class EngineAPIService implements DEngineClientV2 {
  public notes: NotePropsDictV2;
  public schemas: SchemaModuleDictV2;
  public vaults: string[];
  public ws: string;
  public fuseEngine: FuseEngine;

  static create({ port }: { port: number | string }) {
    const api = new DendronAPI({
      endpoint: `http://localhost:${port}`,
      apiPath: "api",
    });
    return new EngineAPIService(api);
  }

  constructor(public api: DendronAPI) {
    this.notes = {};
    this.schemas = {};
    this.fuseEngine = new FuseEngine({ logger: Logger });
    this.vaults =
      DendronWorkspace.workspaceFolders()?.map((ent) => ent.uri.fsPath) || [];
    this.ws = path.dirname(DendronWorkspace.workspaceFile().fsPath);
  }

  /**
   * Load all nodes
   */
  async init(): Promise<DEngineInitRespV2> {
    const ctx = "EngineAPIService:init";
    Logger.info({ ctx, msg: "enter" });
    const resp = await this.api.workspaceInit({
      uri: this.ws,
      config: { vaults: this.vaults },
    });
    if (resp.error) {
      return {
        error: resp.error,
        data: { notes: {}, schemas: {} },
      };
    }
    if (!resp.data) {
      throw new DendronError({ msg: "no data" });
    }
    const { notes, schemas } = resp.data;
    this.notes = notes;
    this.schemas = schemas;
    await this.fuseEngine.updateNotesIndex(notes);
    await this.fuseEngine.updateSchemaIndex(schemas);
    Logger.info({ ctx, msg: "exit" });
    return {
      error: null,
      data: { notes, schemas },
    };
  }

  async deleteNote(id: string, opts?: EngineDeleteOptsV2) {
    const ws = this.ws;
    const resp = await this.api.engineDelete({ id, opts, ws });
    if (!resp.data) {
      throw new DendronError({ msg: "no data" });
    }
    delete this.notes[id];
    await this.refreshNotes(
      _.map(
        _.filter(resp.data, (ent) => ent.status !== "delete"),
        (ent) => ent.note
      )
    );
    return {
      error: null,
      data: resp.data,
    };
  }

  async deleteSchema(id: string, opts?: EngineDeleteOptsV2) {
    const ws = this.ws;
    const resp = await this.api.schemaDelete({ id, opts, ws });
    delete this.schemas[id];
    if (!resp?.data?.notes || !resp?.data?.schemas) {
      throw new DendronError({ msg: "bad delete operation" });
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

  async getNoteByPath(opts: GetNoteOptsV2): Promise<RespV2<GetNotePayloadV2>> {
    const resp = await this.api.engineGetNoteByPath({
      ...opts,
      ws: this.ws,
    });
    if (!_.isUndefined(resp.data)) {
      await this.refreshNotes(_.map(resp.data.changed, (ent) => ent.note));
    }
    return resp;
  }

  // getBatch: (scope: Scope, ids: string[]) => Promise<NodeGetBatchResp>;

  /**
   * Get node based on query
   * query(scope: {username: lukesernau}, queryString: "project", nodeType: note)
   * - []
   * - [Node(id: ..., title: project, children: [])]
   */
  async query(
    queryString: string,
    mode: DNodeTypeV2,
    _opts?: QueryOptsV2
  ): Promise<EngineQueryNoteResp> {
    if (mode === "note") {
      const items = await this.queryNote({ qs: queryString });
      return {
        data: items,
        error: null,
      };
    } else {
      throw Error("query schema nnot implemented");
    }
  }
  async queryNote({ qs }: { qs: string }): Promise<NotePropsV2[]> {
    return await this.fuseEngine.queryNote({ qs });
  }

  /**
   * Shortcut Function
   */
  async queryOne(
    _queryString: string,
    _mode: QueryMode,
    _opts?: QueryOneOpts
  ): Promise<EngineGetResp<DNodeData>> {
    return {} as any;
  }

  async buildNotes() {}

  async refreshNotes(notes: NotePropsV2[]) {
    notes.forEach((node: DNodePropsV2) => {
      const { id } = node;
      this.notes[id] = node;
    });
    this.fuseEngine.updateNotesIndex(this.notes);
  }

  async refreshSchemas(smods: SchemaModulePropsV2[]) {
    smods.forEach((smod) => {
      const id = SchemaUtilsV2.getModuleRoot(smod).id;
      this.schemas[id] = smod;
    });
  }

  async updateNote(
    note: NotePropsV2,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<void> {
    await this.api.engineUpdateNote({ ws: this.ws, note, opts });
    await this.refreshNotes([note]);
    return;
  }

  async writeNote(
    note: NotePropsV2,
    opts?: EngineWriteOptsV2
  ): Promise<WriteNoteResp> {
    const ctx = "write";
    const resp = await this.api.engineWrite({
      node: note,
      opts,
      ws: this.ws,
    });
    const changed = resp.data;
    await this.refreshNotes(_.map(changed, (ent) => ent.note));
    Logger.info({ ctx, msg: "exit", resp });
    return resp;
  }

  // ~~~ schemas
  async getSchema(_qs: string): Promise<RespV2<SchemaModulePropsV2>> {
    throw Error("not implemetned");
  }

  async querySchema(qs: string): Promise<SchemaQueryResp> {
    const out = await this.api.schemaQuery({ qs, ws: this.ws });
    return _.defaults(out, { data: [] });
  }

  async updateSchema(_schema: SchemaModulePropsV2): Promise<void> {
    throw Error("not implemented");
  }

  async writeSchema(schema: SchemaModulePropsV2): Promise<void> {
    await this.api.schemaWrite({ schema, ws: this.ws });
    await this.refreshSchemas([schema]);
    return;
  }
}
