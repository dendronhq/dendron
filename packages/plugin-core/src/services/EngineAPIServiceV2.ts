import {
  APIUtils,
  BulkAddNoteOpts,
  ConfigWriteOpts,
  DendronAPI,
  DEngineClient,
  DEngineInitResp,
  DEngineSyncOpts,
  DHookDict,
  DLink,
  DVault,
  EngineDeleteNotePayload,
  EngineDeleteOpts,
  EngineInfoResp,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  GetNoteBlocksOpts,
  GetNoteBlocksPayload,
  GetNoteOptsV2,
  GetNotePayload,
  IntermediateDendronConfig,
  NoteChangeEntry,
  NoteProps,
  NotePropsDict,
  QueryNotesOpts,
  RefreshNotesOpts,
  RenameNoteOpts,
  RenameNotePayload,
  RenderNoteOpts,
  RenderNotePayload,
  RespRequired,
  RespV2,
  SchemaModuleDict,
  SchemaModuleProps,
} from "@dendronhq/common-all";
import { DendronEngineClient, HistoryService } from "@dendronhq/engine-server";
import _ from "lodash";
import { getDWorkspace } from "../workspace";

export class EngineAPIServiceV2 implements DEngineClient {
  private internalEngine: DEngineClient;

  private _trustedWorkspace: boolean = true;

  get trustedWorkspace(): boolean {
    return this._trustedWorkspace;
  }
  set trustedWorkspace(value: boolean) {
    this._trustedWorkspace = value;
  }

  public notes: NotePropsDict;
  public wsRoot: string;
  public schemas: SchemaModuleDict;
  public links: DLink[];

  public vaults: DVault[];
  public configRoot: string;

  public config: IntermediateDendronConfig;
  public hooks: DHookDict;

  // Props that are not in DEngineClient interface:
  // public ws: string;
  // public fuseEngine: FuseEngine;
  // public api: DendronAPI;
  // public history?: HistoryService;
  // public logger: DLogger;
  // public store: FileStorage;

  static createEngine({
    port,
    enableWorkspaceTrust,
  }: {
    port: number | string;
    enableWorkspaceTrust?: boolean | undefined;
  }): EngineAPIServiceV2 {
    const { vaults, wsRoot } = getDWorkspace();
    const history = HistoryService.instance();

    const api = new DendronAPI({
      endpoint: APIUtils.getLocalEndpoint(
        _.isString(port) ? parseInt(port, 10) : port
      ),
      apiPath: "api",
    });

    const newClientBase = new DendronEngineClient({
      api,
      vaults,
      ws: wsRoot,
      history,
    });

    const newSvc = new EngineAPIServiceV2({ engineClient: newClientBase });

    if (enableWorkspaceTrust !== undefined) {
      newSvc._trustedWorkspace = enableWorkspaceTrust;
    }
    return newSvc;
  }

  constructor({ engineClient }: { engineClient: DEngineClient }) {
    this.internalEngine = engineClient;

    this.notes = this.internalEngine.notes;
    this.wsRoot = this.internalEngine.wsRoot;
    this.schemas = this.internalEngine.schemas;
    this.links = this.internalEngine.links;
    this.vaults = this.internalEngine.vaults;
    this.configRoot = this.internalEngine.configRoot;
    this.config = this.internalEngine.config;
    this.hooks = this.internalEngine.hooks;
  }

  async refreshNotes(opts: RefreshNotesOpts) {
    return this.internalEngine.refreshNotes(opts);
  }

  async bulkAddNotes(opts: BulkAddNoteOpts) {
    return this.internalEngine.bulkAddNotes(opts);
  }

  updateNote(
    note: NoteProps,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<NoteProps> {
    return this.internalEngine.updateNote(note, opts);
  }

  updateSchema(schema: SchemaModuleProps): Promise<void> {
    return this.internalEngine.updateSchema(schema);
  }

  writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2 | undefined
  ): Promise<Required<RespV2<NoteChangeEntry[]>>> {
    if (!this._trustedWorkspace) {
      if (!opts) {
        opts = { runHooks: false };
      } else {
        opts.runHooks = false;
      }
    }

    return this.internalEngine.writeNote(note, opts);
  }

  writeSchema(schema: SchemaModuleProps): Promise<void> {
    return this.internalEngine.writeSchema(schema);
  }
  init(): Promise<DEngineInitResp> {
    return this.internalEngine.init();
  }

  deleteNote(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<Required<RespV2<EngineDeleteNotePayload>>> {
    return this.internalEngine.deleteNote(id, opts);
  }

  deleteSchema(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<DEngineInitResp> {
    return this.internalEngine.deleteSchema(id, opts);
  }

  info(): Promise<RespRequired<EngineInfoResp>> {
    return this.internalEngine.info();
  }

  sync(opts?: DEngineSyncOpts | undefined): Promise<DEngineInitResp> {
    return this.internalEngine.sync(opts);
  }

  getNoteByPath(opts: GetNoteOptsV2): Promise<RespV2<GetNotePayload>> {
    // opts.npath = opts.overrides?.types
    return this.internalEngine.getNoteByPath(opts);
  }

  getSchema(qs: string): Promise<RespV2<SchemaModuleProps>> {
    return this.internalEngine.getSchema(qs);
  }

  querySchema(qs: string): Promise<Required<RespV2<SchemaModuleProps[]>>> {
    return this.internalEngine.querySchema(qs);
  }

  queryNotes(opts: QueryNotesOpts): Promise<Required<RespV2<NoteProps[]>>> {
    return this.internalEngine.queryNotes(opts);
  }

  queryNotesSync({
    qs,
    vault,
  }: {
    qs: string;
    vault?: DVault | undefined;
  }): Required<RespV2<NoteProps[]>> {
    return this.internalEngine.queryNotesSync({ qs, vault });
  }

  renameNote(opts: RenameNoteOpts): Promise<RespV2<RenameNotePayload>> {
    return this.internalEngine.renameNote(opts);
  }
  renderNote(opts: RenderNoteOpts): Promise<RespV2<RenderNotePayload>> {
    return this.internalEngine.renderNote(opts);
  }
  getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksPayload> {
    return this.internalEngine.getNoteBlocks(opts);
  }
  writeConfig(opts: ConfigWriteOpts): Promise<RespV2<void>> {
    return this.internalEngine.writeConfig(opts);
  }
  getConfig(): Promise<RespV2<IntermediateDendronConfig>> {
    return this.internalEngine.getConfig();
  }
}
