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
  GetDecorationsOpts,
  GetDecorationsPayload,
  GetNoteBlocksOpts,
  GetNoteBlocksPayload,
  GetNoteOptsV2,
  GetNotePayload,
  IntermediateDendronConfig,
  NoteChangeEntry,
  NoteFNamesDict,
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
import { IEngineAPIService } from "./EngineAPIServiceInterface";

export class EngineAPIService implements DEngineClient, IEngineAPIService {
  private internalEngine: DEngineClient;

  private _trustedWorkspace: boolean = true;

  static createEngine({
    port,
    enableWorkspaceTrust,
    vaults,
    wsRoot,
  }: {
    port: number | string;
    enableWorkspaceTrust?: boolean | undefined;
    vaults: DVault[];
    wsRoot: string;
  }): EngineAPIService {
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

    const newSvc = new EngineAPIService({ engineClient: newClientBase });

    if (enableWorkspaceTrust !== undefined) {
      newSvc._trustedWorkspace = enableWorkspaceTrust;
    }
    return newSvc;
  }

  constructor({ engineClient }: { engineClient: DEngineClient }) {
    this.internalEngine = engineClient;
  }

  get trustedWorkspace(): boolean {
    return this._trustedWorkspace;
  }

  set trustedWorkspace(value: boolean) {
    this._trustedWorkspace = value;
  }

  public get notes(): NotePropsDict {
    return this.internalEngine.notes;
  }
  public set notes(arg: NotePropsDict) {
    this.internalEngine.notes = arg;
  }

  public get noteFnames(): NoteFNamesDict {
    return this.internalEngine.noteFnames;
  }
  public set noteFnames(arg: NoteFNamesDict) {
    this.internalEngine.noteFnames = arg;
  }

  public get wsRoot(): string {
    return this.internalEngine.wsRoot;
  }
  public set wsRoot(arg: string) {
    this.internalEngine.wsRoot = arg;
  }

  public get schemas(): SchemaModuleDict {
    return this.internalEngine.schemas;
  }
  public set schemas(arg: SchemaModuleDict) {
    this.internalEngine.schemas = arg;
  }

  public get links(): DLink[] {
    return this.internalEngine.links;
  }
  public set links(arg: DLink[]) {
    this.internalEngine.links = arg;
  }

  public get vaults(): DVault[] {
    return this.internalEngine.vaults;
  }
  public set vaults(arg: DVault[]) {
    this.internalEngine.vaults = arg;
  }

  public get configRoot(): string {
    return this.internalEngine.configRoot;
  }
  public set configRoot(arg: string) {
    this.internalEngine.configRoot = arg;
  }

  public get config(): IntermediateDendronConfig {
    return this.internalEngine.config;
  }
  public set config(arg: IntermediateDendronConfig) {
    this.internalEngine.config = arg;
  }

  public get hooks(): DHookDict {
    return this.internalEngine.hooks;
  }
  public set hooks(arg: DHookDict) {
    this.internalEngine.hooks = arg;
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

  getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsPayload> {
    return this.internalEngine.getDecorations(opts);
  }
}
