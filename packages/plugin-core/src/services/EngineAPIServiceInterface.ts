import {
  BulkGetNoteMetaResp,
  BulkGetNoteResp,
  BulkWriteNotesOpts,
  BulkWriteNotesResp,
  DeleteNoteResp,
  DEngineInitResp,
  DHookDict,
  DVault,
  EngineDeleteOpts,
  EngineEventEmitter,
  EngineInfoResp,
  EngineWriteOptsV2,
  FindNoteOpts,
  FindNotesMetaResp,
  FindNotesResp,
  GetDecorationsOpts,
  GetDecorationsResp,
  GetNoteBlocksOpts,
  GetNoteBlocksResp,
  GetNoteMetaResp,
  GetNoteResp,
  GetSchemaResp,
  NoteProps,
  QueryNotesMetaResp,
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

export interface IEngineAPIService {
  trustedWorkspace: boolean;
  wsRoot: string;
  vaults: DVault[];
  hooks: DHookDict;
  engineEventEmitter: EngineEventEmitter;

  /**
   * Get NoteProps by id. If note doesn't exist, return undefined
   */
  getNote: (id: string) => Promise<GetNoteResp>;
  /**
   * Get NoteProps metadata by id. If note doesn't exist, return error
   */
  getNoteMeta: (id: string) => Promise<GetNoteMetaResp>;
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

  queryNotesMeta: (opts: QueryNotesOpts) => Promise<QueryNotesMetaResp>;

  renameNote(opts: RenameNoteOpts): Promise<RenameNoteResp>;

  renderNote(opts: RenderNoteOpts): Promise<RenderNoteResp>;

  getNoteBlocks(opts: GetNoteBlocksOpts): Promise<GetNoteBlocksResp>;

  getDecorations(opts: GetDecorationsOpts): Promise<GetDecorationsResp>;
}
