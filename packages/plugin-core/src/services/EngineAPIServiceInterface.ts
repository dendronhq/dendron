import {
  BulkWriteNotesOpts,
  DEngineInitResp,
  DHookDict,
  DVault,
  DeleteNoteResp,
  EngineDeleteOpts,
  EngineEventEmitter,
  EngineInfoResp,
  EngineWriteOptsV2,
  FindNoteOpts,
  GetDecorationsOpts,
  GetDecorationsResp,
  GetNoteBlocksOpts,
  GetNoteBlocksResp,
  NoteProps,
  NotePropsByFnameDict,
  NotePropsByIdDict,
  QueryNotesOpts,
  RenameNoteOpts,
  RenderNoteOpts,
  SchemaModuleDict,
  SchemaModuleProps,
  WriteNoteResp,
  GetNoteResp,
  FindNotesResp,
  FindNotesMetaResp,
  BulkGetNoteResp,
  BulkGetNoteMetaResp,
  BulkWriteNotesResp,
  RenameNoteResp,
  QueryNotesResp,
  RenderNoteResp,
  GetSchemaResp,
  QuerySchemaResp,
  WriteSchemaResp,
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
  getNote: (id: string) => Promise<GetNoteResp>;
  /**
   * Bulk get NoteProps by list of ids
   */
  bulkGetNotes: (ids: string[]) => Promise<BulkGetNoteResp>;
  /**
   * Bulk get NoteProps metadata by list of ids
   */
  bulkGetNotesMeta: (ids: string[]) => Promise<BulkGetNoteMetaResp>;
  /**
   * Find NoteProps by note properties. If no notes match, return empty list
   */
  findNotes: (opts: FindNoteOpts) => Promise<FindNotesResp>;
  /**
   * Find NoteProps metadata by note properties. If no notes metadata match, return empty list
   */
  findNotesMeta: (opts: FindNoteOpts) => Promise<FindNotesMetaResp>;

  bulkWriteNotes(opts: BulkWriteNotesOpts): Promise<BulkWriteNotesResp>;

  writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2 | undefined
  ): Promise<WriteNoteResp>;

  writeSchema(schema: SchemaModuleProps): Promise<WriteSchemaResp>;

  init(): Promise<DEngineInitResp>;

  deleteNote(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<DeleteNoteResp>;

  deleteSchema(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<DEngineInitResp>;

  info(): Promise<EngineInfoResp>;

  getSchema(qs: string): Promise<GetSchemaResp>;

  querySchema(qs: string): Promise<QuerySchemaResp>;

  queryNotes(opts: QueryNotesOpts): Promise<QueryNotesResp>;

  queryNotesSync({
    qs,
    originalQS,
    vault,
  }: {
    qs: string;
    originalQS: string;
    vault?: DVault | undefined;
  }): QueryNotesResp;

  renameNote(opts: RenameNoteOpts): Promise<RenameNoteResp>;

  renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp>;

  getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksResp>;

  getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsResp>;
}
