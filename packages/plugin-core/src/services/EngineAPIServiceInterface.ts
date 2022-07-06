import {
  BulkResp,
  BulkWriteNotesOpts,
  ConfigWriteOpts,
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
import { EngineEventEmitter } from "@dendronhq/engine-server";

export interface IEngineAPIService {
  trustedWorkspace: boolean;
  /**
   * @deprecated
   * For accessing a specific note by id, see {@link IEngineAPIService.getNote}
   * If you need all notes, avoid modifying any note as this will cause unintended changes on the store side
   */
  notes: NotePropsByIdDict;
  /**
   * @deprecated see {@link IEngineAPIService.findNotes}
   */
  noteFnames: NotePropsByFnameDict;
  wsRoot: string;
  schemas: SchemaModuleDict;
  links: DLink[];
  vaults: DVault[];
  configRoot: string;
  config: IntermediateDendronConfig;
  hooks: DHookDict;
  engineEventEmitter: EngineEventEmitter;

  /**
   * Get NoteProps by id. If note doesn't exist, return undefined
   */
  getNote: (id: string) => Promise<NoteProps | undefined>;
  /**
   * Find NoteProps by note properties. If no notes match, return empty list
   */
  findNotes: (opts: FindNoteOpts) => Promise<NoteProps[]>;

  refreshNotes(opts: RefreshNotesOpts): Promise<RespV2<void>>;

  bulkWriteNotes(
    opts: BulkWriteNotesOpts
  ): Promise<BulkResp<NoteChangeEntry[]>>;

  updateNote(
    note: NoteProps,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<NoteProps>;

  updateSchema(schema: SchemaModuleProps): Promise<void>;

  writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2 | undefined
  ): Promise<RespV2<NoteChangeEntry[]>>;

  writeSchema(schema: SchemaModuleProps): Promise<void>;

  init(): Promise<DEngineInitResp>;

  deleteNote(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<Required<RespV2<EngineDeleteNotePayload>>>;

  deleteSchema(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<DEngineInitResp>;

  info(): Promise<RespV2<EngineInfoResp>>;

  sync(opts?: DEngineSyncOpts | undefined): Promise<DEngineInitResp>;

  getSchema(qs: string): Promise<RespV2<SchemaModuleProps>>;

  querySchema(qs: string): Promise<Required<RespV2<SchemaModuleProps[]>>>;

  queryNotes(opts: QueryNotesOpts): Promise<RespV2<NoteProps[]>>;

  queryNotesSync({
    qs,
    originalQS,
    vault,
  }: {
    qs: string;
    originalQS: string;
    vault?: DVault | undefined;
  }): RespV2<NoteProps[]>;

  renameNote(opts: RenameNoteOpts): Promise<RespV2<RenameNotePayload>>;

  renderNote(opts: RenderNoteOpts): Promise<RespV2<RenderNotePayload>>;

  getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksPayload>;

  writeConfig(opts: ConfigWriteOpts): Promise<RespV2<void>>;

  getConfig(): Promise<RespV2<IntermediateDendronConfig>>;

  getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsPayload>;
  getLinks: (
    opts: Optional<GetLinksRequest, "ws">
  ) => Promise<GetNoteLinksPayload>;
  getAnchors: (opts: GetAnchorsRequest) => Promise<GetNoteAnchorsPayload>;
}
