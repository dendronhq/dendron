import {
  APIUtils,
  BulkWriteNotesOpts,
  ConfigWriteOpts,
  DendronAPI,
  DEngineClient,
  DEngineInitResp,
  DEngineSyncOpts,
  DHookDict,
  DLink,
  DVault,
  EngagementEvents,
  EngineDeleteNotePayload,
  EngineDeleteOpts,
  EngineInfoResp,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  Event,
  extractNoteChangeEntriesByType,
  FindNoteOpts,
  GetAnchorsRequest,
  GetDecorationsOpts,
  GetDecorationsPayload,
  GetLinksRequest,
  GetNoteAnchorsPayload,
  GetNoteBlocksOpts,
  GetNoteBlocksPayload,
  GetNoteLinksPayload,
  IntermediateDendronConfig,
  NoteChangeEntry,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  Optional,
  QueryNotesOpts,
  RefreshNotesOpts,
  RenameNoteOpts,
  RenameNotePayload,
  RenderNoteOpts,
  RenderNotePayload,
  RespV2,
  SchemaModuleDict,
  SchemaModuleProps,
} from "@dendronhq/common-all";
import {
  DendronEngineClient,
  EngineEventEmitter,
  HistoryService,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { AnalyticsUtils } from "../utils/analytics";
import { IEngineAPIService } from "./EngineAPIServiceInterface";

export class EngineAPIService
  implements DEngineClient, IEngineAPIService, EngineEventEmitter
{
  private _internalEngine: DEngineClient;
  private _engineEventEmitter: EngineEventEmitter;
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

    const newSvc = new EngineAPIService({
      engineClient: newClientBase,
      engineEvents: newClientBase,
    });

    if (enableWorkspaceTrust !== undefined) {
      newSvc._trustedWorkspace = enableWorkspaceTrust;
    }
    return newSvc;
  }

  constructor({
    engineClient,
    engineEvents,
  }: {
    engineClient: DEngineClient;
    engineEvents: EngineEventEmitter;
  }) {
    this._internalEngine = engineClient;
    this._engineEventEmitter = engineEvents;
  }
  get onEngineNoteStateChanged(): Event<NoteChangeEntry[]> {
    return this._engineEventEmitter.onEngineNoteStateChanged;
  }

  dispose() {
    this._engineEventEmitter.dispose();
  }

  get trustedWorkspace(): boolean {
    return this._trustedWorkspace;
  }

  set trustedWorkspace(value: boolean) {
    this._trustedWorkspace = value;
  }

  /**
   * @deprecated
   * For accessing a specific note by id, see {@link EngineAPIService.getNote}
   * If you need all notes, avoid modifying any note as this will cause unintended changes on the store side
   */
  public get notes(): NotePropsByIdDict {
    return this._internalEngine.notes;
  }
  public set notes(arg: NotePropsByIdDict) {
    this._internalEngine.notes = arg;
  }

  /**
   * @deprecated see {@link EngineAPIService.findNotes}
   */
  public get noteFnames(): NotePropsByFnameDict {
    return this._internalEngine.noteFnames;
  }
  public set noteFnames(arg: NotePropsByFnameDict) {
    this._internalEngine.noteFnames = arg;
  }

  public get wsRoot(): string {
    return this._internalEngine.wsRoot;
  }
  public set wsRoot(arg: string) {
    this._internalEngine.wsRoot = arg;
  }

  public get schemas(): SchemaModuleDict {
    return this._internalEngine.schemas;
  }
  public set schemas(arg: SchemaModuleDict) {
    this._internalEngine.schemas = arg;
  }

  public get links(): DLink[] {
    return this._internalEngine.links;
  }
  public set links(arg: DLink[]) {
    this._internalEngine.links = arg;
  }

  public get vaults(): DVault[] {
    return this._internalEngine.vaults;
  }
  public set vaults(arg: DVault[]) {
    this._internalEngine.vaults = arg;
  }

  public get configRoot(): string {
    return this._internalEngine.configRoot;
  }
  public set configRoot(arg: string) {
    this._internalEngine.configRoot = arg;
  }

  public get config(): IntermediateDendronConfig {
    return this._internalEngine.config;
  }
  public set config(arg: IntermediateDendronConfig) {
    this._internalEngine.config = arg;
  }

  public get hooks(): DHookDict {
    return this._internalEngine.hooks;
  }
  public set hooks(arg: DHookDict) {
    this._internalEngine.hooks = arg;
  }

  public get engineEventEmitter(): EngineEventEmitter {
    return this._engineEventEmitter;
  }

  /**
   * See {@link IEngineAPIService.getNote}
   */
  async getNote(id: string): Promise<NoteProps | undefined> {
    return this._internalEngine.getNote(id);
  }

  /**
   * See {@link IEngineAPIService.findNotes}
   */
  async findNotes(opts: FindNoteOpts): Promise<NoteProps[]> {
    return this._internalEngine.findNotes(opts);
  }

  async refreshNotes(opts: RefreshNotesOpts) {
    return this._internalEngine.refreshNotes(opts);
  }

  async bulkWriteNotes(opts: BulkWriteNotesOpts) {
    return this._internalEngine.bulkWriteNotes(opts);
  }

  updateNote(
    note: NoteProps,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<NoteProps> {
    return this._internalEngine.updateNote(note, opts);
  }

  updateSchema(schema: SchemaModuleProps): Promise<void> {
    return this._internalEngine.updateSchema(schema);
  }

  writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2 | undefined
  ): Promise<RespV2<NoteChangeEntry[]>> {
    if (!this._trustedWorkspace) {
      if (!opts) {
        opts = { runHooks: false };
      } else {
        opts.runHooks = false;
      }
    }

    return this._internalEngine.writeNote(note, opts);
  }

  writeSchema(schema: SchemaModuleProps): Promise<void> {
    return this._internalEngine.writeSchema(schema);
  }
  init(): Promise<DEngineInitResp> {
    this.setupEngineAnalyticsTracking();
    return this._internalEngine.init();
  }

  deleteNote(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<Required<RespV2<EngineDeleteNotePayload>>> {
    return this._internalEngine.deleteNote(id, opts);
  }

  deleteSchema(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<DEngineInitResp> {
    return this._internalEngine.deleteSchema(id, opts);
  }

  info(): Promise<RespV2<EngineInfoResp>> {
    return this._internalEngine.info();
  }

  sync(opts?: DEngineSyncOpts | undefined): Promise<DEngineInitResp> {
    return this._internalEngine.sync(opts);
  }

  getSchema(qs: string): Promise<RespV2<SchemaModuleProps>> {
    return this._internalEngine.getSchema(qs);
  }

  querySchema(qs: string): Promise<Required<RespV2<SchemaModuleProps[]>>> {
    return this._internalEngine.querySchema(qs);
  }

  queryNotes(opts: QueryNotesOpts): Promise<RespV2<NoteProps[]>> {
    return this._internalEngine.queryNotes(opts);
  }

  queryNotesSync({
    qs,
    originalQS,
    vault,
  }: {
    qs: string;
    originalQS: string;
    vault?: DVault | undefined;
  }): RespV2<NoteProps[]> {
    return this._internalEngine.queryNotesSync({ qs, originalQS, vault });
  }

  renameNote(opts: RenameNoteOpts): Promise<RespV2<RenameNotePayload>> {
    return this._internalEngine.renameNote(opts);
  }

  renderNote(opts: RenderNoteOpts): Promise<RespV2<RenderNotePayload>> {
    return this._internalEngine.renderNote(opts);
  }

  getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksPayload> {
    return this._internalEngine.getNoteBlocks(opts);
  }

  writeConfig(opts: ConfigWriteOpts): Promise<RespV2<void>> {
    return this._internalEngine.writeConfig(opts);
  }

  getConfig(): Promise<RespV2<IntermediateDendronConfig>> {
    return this._internalEngine.getConfig();
  }

  getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsPayload> {
    return this._internalEngine.getDecorations(opts);
  }

  getLinks(
    opts: Optional<GetLinksRequest, "ws">
  ): Promise<GetNoteLinksPayload> {
    return this._internalEngine.getLinks(opts);
  }

  getAnchors(opts: GetAnchorsRequest): Promise<GetNoteAnchorsPayload> {
    return this._internalEngine.getAnchors(opts);
  }

  /**
   * Setup telemetry tracking on engine events to understand user engagement
   * levels
   */
  private setupEngineAnalyticsTracking() {
    this._engineEventEmitter.onEngineNoteStateChanged((entries) => {
      const createCount = extractNoteChangeEntriesByType(
        entries,
        "create"
      ).length;

      const updateCount = extractNoteChangeEntriesByType(
        entries,
        "update"
      ).length;

      const deleteCount = extractNoteChangeEntriesByType(
        entries,
        "delete"
      ).length;

      AnalyticsUtils.track(EngagementEvents.EngineStateChanged, {
        created: createCount,
        updated: updateCount,
        deleted: deleteCount,
      });
    });
  }
}
