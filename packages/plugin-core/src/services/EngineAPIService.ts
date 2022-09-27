import {
  APIUtils,
  BulkGetNoteMetaResp,
  BulkGetNoteResp,
  BulkWriteNotesOpts,
  BulkWriteNotesResp,
  DeleteNoteResp,
  DendronAPI,
  DEngineClient,
  DEngineInitResp,
  DHookDict,
  DVault,
  EngagementEvents,
  EngineDeleteOpts,
  EngineEventEmitter,
  EngineInfoResp,
  EngineSchemaWriteOpts,
  EngineWriteOptsV2,
  Event,
  extractNoteChangeEntriesByType,
  FindNoteOpts,
  GetDecorationsOpts,
  GetDecorationsResp,
  GetNoteBlocksOpts,
  GetNoteBlocksResp,
  GetNoteMetaResp,
  GetNoteResp,
  GetSchemaResp,
  NoteChangeEntry,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  QueryNotesOpts,
  QueryNotesResp,
  QuerySchemaResp,
  RenameNoteOpts,
  RenameNoteResp,
  RenderNoteOpts,
  RenderNoteResp,
  SchemaModuleProps,
  WriteNoteResp,
  WriteSchemaResp,
} from "@dendronhq/common-all";
import { DendronEngineClient, HistoryService } from "@dendronhq/engine-server";
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

  public get vaults(): DVault[] {
    return this._internalEngine.vaults;
  }
  public set vaults(arg: DVault[]) {
    this._internalEngine.vaults = arg;
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
  async getNote(id: string): Promise<GetNoteResp> {
    return this._internalEngine.getNote(id);
  }

  /**
   * See {@link IEngineAPIService.getNote}
   */
  async getNoteMeta(id: string): Promise<GetNoteMetaResp> {
    return this._internalEngine.getNoteMeta(id);
  }

  /**
   * See {@link IEngineAPIService.bulkGetNotes}
   */
  async bulkGetNotes(ids: string[]): Promise<BulkGetNoteResp> {
    return this._internalEngine.bulkGetNotes(ids);
  }

  /**
   * See {@link IEngineAPIService.bulkGetNotesMeta}
   */
  async bulkGetNotesMeta(ids: string[]): Promise<BulkGetNoteMetaResp> {
    return this._internalEngine.bulkGetNotesMeta(ids);
  }

  /**
   * See {@link IEngineAPIService.findNotes}
   */
  async findNotes(opts: FindNoteOpts): Promise<NoteProps[]> {
    return this._internalEngine.findNotes(opts);
  }

  /**
   * See {@link IEngineAPIService.findNotesMeta}
   */
  async findNotesMeta(opts: FindNoteOpts): Promise<NotePropsMeta[]> {
    return this._internalEngine.findNotesMeta(opts);
  }

  async bulkWriteNotes(opts: BulkWriteNotesOpts): Promise<BulkWriteNotesResp> {
    return this._internalEngine.bulkWriteNotes(opts);
  }

  writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2 | undefined
  ): Promise<WriteNoteResp> {
    if (!this._trustedWorkspace) {
      if (!opts) {
        opts = { runHooks: false };
      } else {
        opts.runHooks = false;
      }
    }

    return this._internalEngine.writeNote(note, opts);
  }

  writeSchema(
    schema: SchemaModuleProps,
    opts?: EngineSchemaWriteOpts
  ): Promise<WriteSchemaResp> {
    return this._internalEngine.writeSchema(schema, opts);
  }
  init(): Promise<DEngineInitResp> {
    // this.setupEngineAnalyticsTracking();
    return this._internalEngine.init();
  }

  deleteNote(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<DeleteNoteResp> {
    return this._internalEngine.deleteNote(id, opts);
  }

  deleteSchema(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<DEngineInitResp> {
    return this._internalEngine.deleteSchema(id, opts);
  }

  info(): Promise<EngineInfoResp> {
    return this._internalEngine.info();
  }

  getSchema(qs: string): Promise<GetSchemaResp> {
    return this._internalEngine.getSchema(qs);
  }

  querySchema(qs: string): Promise<QuerySchemaResp> {
    return this._internalEngine.querySchema(qs);
  }

  queryNotes(opts: QueryNotesOpts): Promise<QueryNotesResp> {
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
  }): QueryNotesResp {
    return this._internalEngine.queryNotesSync({ qs, originalQS, vault });
  }

  renameNote(opts: RenameNoteOpts): Promise<RenameNoteResp> {
    return this._internalEngine.renameNote(opts);
  }

  renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp> {
    return this._internalEngine.renderNote(opts);
  }

  getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksResp> {
    return this._internalEngine.getNoteBlocks(opts);
  }

  getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsResp> {
    return this._internalEngine.getDecorations(opts);
  }

  /**
   * Setup telemetry tracking on engine events to understand user engagement
   * levels
   */
  // @ts-ignore
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
