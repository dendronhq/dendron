import {
  BulkAddNoteOpts,
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
  GetAnchorsRequest,
  GetDecorationsOpts,
  GetDecorationsPayload,
  GetLinksRequest,
  GetNoteAnchorsPayload,
  GetNoteBlocksOpts,
  GetNoteBlocksPayload,
  GetNoteLinksPayload,
  GetNoteOptsV2,
  GetNotePayload,
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
  RespRequired,
  RespV2,
  SchemaModuleDict,
  SchemaModuleProps,
} from "@dendronhq/common-all";
import { EngineEventEmitter } from "@dendronhq/engine-server";

export interface IEngineAPIService {
  trustedWorkspace: boolean;
  notes: NotePropsByIdDict;
  noteFnames: NotePropsByFnameDict;
  wsRoot: string;
  schemas: SchemaModuleDict;
  links: DLink[];
  vaults: DVault[];
  configRoot: string;
  config: IntermediateDendronConfig;
  hooks: DHookDict;
  engineEventEmitter: EngineEventEmitter;

  refreshNotes(opts: RefreshNotesOpts): Promise<RespV2<void>>;

  bulkAddNotes(
    opts: BulkAddNoteOpts
  ): Promise<Required<RespV2<NoteChangeEntry[]>>>;

  updateNote(
    note: NoteProps,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<NoteProps>;

  updateSchema(schema: SchemaModuleProps): Promise<void>;

  writeNote(
    note: NoteProps,
    opts?: EngineWriteOptsV2 | undefined
  ): Promise<Required<RespV2<NoteChangeEntry[]>>>;

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

  info(): Promise<RespRequired<EngineInfoResp>>;

  sync(opts?: DEngineSyncOpts | undefined): Promise<DEngineInitResp>;

  getNoteByPath(opts: GetNoteOptsV2): Promise<RespV2<GetNotePayload>>;

  getSchema(qs: string): Promise<RespV2<SchemaModuleProps>>;

  querySchema(qs: string): Promise<Required<RespV2<SchemaModuleProps[]>>>;

  queryNotes(opts: QueryNotesOpts): Promise<Required<RespV2<NoteProps[]>>>;

  queryNotesSync({
    qs,
    originalQS,
    vault,
  }: {
    qs: string;
    originalQS: string;
    vault?: DVault | undefined;
  }): Required<RespV2<NoteProps[]>>;

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
