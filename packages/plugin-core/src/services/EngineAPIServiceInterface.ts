import {
  BulkResp,
  BulkWriteNotesOpts,
  DEngineInitResp,
  DHookDict,
  DVault,
  EngineDeleteNotePayload,
  EngineDeleteOpts,
  EngineEventEmitter,
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
  NoteChangeEntry,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  NotePropsMeta,
  Optional,
  QueryNotesOpts,
  RenameNoteOpts,
  RenameNotePayload,
  RenderNoteOpts,
  RenderNotePayload,
  RespV2,
  RespV3,
  SchemaModuleDict,
  SchemaModuleProps,
  UpdateNoteResp,
} from "@dendronhq/common-all";

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
  vaults: DVault[];
  hooks: DHookDict;
  engineEventEmitter: EngineEventEmitter;

  /**
   * Get NoteProps by id. If note doesn't exist, return undefined
   */
  getNote: (id: string) => Promise<RespV3<NoteProps>>;
  /**
   * Find NoteProps by note properties. If no notes match, return empty list
   */
  findNotes: (opts: FindNoteOpts) => Promise<NoteProps[]>;
  /**
   * Find NoteProps metadata by note properties. If no notes metadata match, return empty list
   */
  findNotesMeta: (opts: FindNoteOpts) => Promise<NotePropsMeta[]>;

  bulkWriteNotes(
    opts: BulkWriteNotesOpts
  ): Promise<BulkResp<NoteChangeEntry[]>>;

  updateNote(
    note: NoteProps,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<UpdateNoteResp>;

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
  ): Promise<RespV2<EngineDeleteNotePayload>>;

  deleteSchema(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<DEngineInitResp>;

  info(): Promise<RespV2<EngineInfoResp>>;

  getSchema(qs: string): Promise<RespV3<SchemaModuleProps>>;

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

  getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsPayload>;
  getLinks: (
    opts: Optional<GetLinksRequest, "ws">
  ) => Promise<GetNoteLinksPayload>;
  getAnchors: (opts: GetAnchorsRequest) => Promise<GetNoteAnchorsPayload>;
}
