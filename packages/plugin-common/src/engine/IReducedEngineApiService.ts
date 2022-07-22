import {
  BulkResp,
  BulkWriteNotesOpts,
  EngineDeleteNotePayload,
  EngineDeleteOpts,
  EngineWriteOptsV2,
  FindNoteOpts,
  NoteChangeEntry,
  NoteProps,
  NotePropsMeta,
  QueryNotesOpts,
  RefreshNotesOpts,
  RenameNoteOpts,
  RenameNotePayload,
  RenderNoteOpts,
  RenderNotePayload,
  RespV2,
  SchemaModuleProps,
} from "@dendronhq/common-all";

// Subset of IEngineAPIService
export interface IReducedEngineAPIService {
  /**
   * Get NoteProps by id. If note doesn't exist, return undefined
   */
  getNote: (id: string) => Promise<NoteProps | undefined>;
  /**
   * Find NoteProps by note properties. If no notes match, return empty list
   */
  findNotes: (opts: FindNoteOpts) => Promise<NoteProps[]>;
  /**
   * Find NoteProps metadata by note properties. If no notes metadata match, return empty list
   */
  findNotesMeta: (opts: FindNoteOpts) => Promise<NotePropsMeta[]>;

  // refreshNotes(opts: RefreshNotesOpts): Promise<RespV2<void>>;

  bulkWriteNotes(
    opts: BulkWriteNotesOpts
  ): Promise<BulkResp<NoteChangeEntry[]>>;

  writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2 | undefined
  ): Promise<RespV2<NoteChangeEntry[]>>;

  // writeSchema(schema: SchemaModuleProps): Promise<void>;

  deleteNote(
    id: string,
    opts?: EngineDeleteOpts | undefined
  ): Promise<Required<RespV2<EngineDeleteNotePayload>>>;

  renameNote(opts: RenameNoteOpts): Promise<RespV2<RenameNotePayload>>;

  // renderNote(opts: RenderNoteOpts): Promise<RespV2<RenderNotePayload>>;

  queryNotes(opts: QueryNotesOpts): Promise<RespV2<NoteProps[]>>;
}
