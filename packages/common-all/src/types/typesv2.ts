import { URI } from "vscode-uri";
import { Decoration, DendronConfig, Diagnostic } from ".";
import { IDendronError } from "../error";
import { VSRange } from "./compat";
import { DVault } from "./DVault";
import { FindNoteOpts } from "./FindNoteOpts";
import {
  DNodeProps,
  DNodeType,
  DNoteAnchorPositioned,
  DNoteLoc,
  NoteProps,
  NotePropsMeta,
  Position,
  SchemaData,
  SchemaProps,
} from "./foundation";
import { DHookDict } from "./hooks";
import { DendronASTDest, ProcFlavor } from "./unified";

export type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> &
  Pick<T, TRequired>;

export type EngineDeleteOpts = {
  /**
   * If true, delete only from metadata store. Otherwise, delete from metadata store and filesystem.
   */
  metaOnly?: boolean;
  /**
   * If node is deleted and parents are stubs, default behavior is to alsod delete parents
   */
  noDeleteParentStub?: boolean;
};

export type AnyJson = boolean | number | string | null | JsonArray | JsonMap;
export type JsonMap = { [key: string]: AnyJson };
export type JsonArray = AnyJson[];

// === New

export type DLinkType = "wiki" | "refv2" | "hashtag" | "usertag" | "fmtag";

export type DNoteLinkData = {
  // TODO: should be backfilled to be mandatory
  xvault?: boolean;
  /** Denotes that the link is a same file link, for example `[[#anchor]]` */
  sameFile?: boolean;
};
export type DNoteLink<TData extends DNoteLinkData = DNoteLinkData> = {
  type: "ref" | "wiki" | "md" | "backlink" | "linkCandidate" | "frontmatterTag";
  position?: Position;
  from: DNoteLoc;
  to?: DNoteLoc;
  data: TData;
};

export type DNoteLinkRaw<TData extends DNoteLinkData = any> = Omit<
  DNoteLink<TData>,
  "from"
> & {
  from?: DNoteLoc;
};

export type DNoteRefData = {
  anchorStart?: string;
  anchorEnd?: string;
  anchorStartOffset?: number;
  vaultName?: string;
  /**
   * File link: wiki based links (eg. [[foo]])
   * Id link: TBD (eg. ^1234)
   */
  type: "file" | "id";
} & DNoteLinkData;
export type DNoteRefLink = DNoteLink<DNoteRefData>;
export type DNoteRefLinkRaw = DNoteLinkRaw<DNoteRefData>;

/**
 * Opts are arguments used when creating a node
 */
export type DNodeOpts<T = any> = Partial<
  Omit<DNodeProps<T>, "fname|type|vault">
> & { fname: string; type: DNodeType; vault: DVault };

export type SchemaRaw = Pick<SchemaProps, "id"> &
  Partial<SchemaData> & { title?: string; desc?: string } & Partial<
    Pick<DNodeProps, "children">
  >;

export type SchemaOpts = Omit<DNodeOpts<SchemaData>, "type" | "id" | "body"> & {
  id: string;
};
export type NoteOpts = Omit<DNodeOpts, "type">;

export type DNodePropsQuickInputV2<T = any> = DNodeProps<T> & {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};

/**
 * A reduced version of NoteQuickInput that only keeps the props necessary for
 * lookup quick pick items
 */
export type NoteQuickInputV2 = NotePropsMeta & {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};

/**
 * Map of noteId -> noteProp
 */
export type NotePropsByIdDict = {
  [key: string]: NoteProps;
};

/**
 * Map of noteFname -> list of noteIds. Since fname is not unique across vaults, there can be multiple ids with the same fname
 */
export type NotePropsByFnameDict = {
  [key: string]: string[];
};

/**
 * Type to keep track of forward index (notesById) and inverted indices (notesByFname)
 * Use {@link NoteDictsUtils} to perform operations that need to update all indices
 */
export type NoteDicts = {
  notesById: NotePropsByIdDict;
  notesByFname: NotePropsByFnameDict;
};

export type SchemaPropsDict = {
  [key: string]: SchemaProps;
};

export type SchemaModuleDict = {
  [key: string]: SchemaModuleProps;
};

export type SchemaQuickInput = SchemaProps & {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};

// ---

export type SchemaImport = string[];
export type SchemaModuleOpts = {
  version: number;
  imports?: SchemaImport;
  schemas: SchemaOpts[];
};

/**
 * This represents a `schema.yml` file
 */
export type SchemaModuleProps = {
  /**
   * Currently, this is set to 1. In the future, we might introduce
   * non-backward compatible schema changes
   */
  version: number;
  /**
   * A schema can import schmeas from other files
   */
  imports?: SchemaImport;
  /**
   * This is all the schema definitions in a schema module
   */
  schemas: SchemaPropsDict;
  /**
   * This is the root note of your schema definitions.
   */
  root: SchemaProps;
  /**
   * Name of the schema file without the `.schema.yml` suffix
   */
  fname: string;
  /**
   * Vault
   */
  vault: DVault;
};

// === Engine

export interface RespV2<T> {
  data?: T;
  error: IDendronError | null;
}

export type RespV3ErrorResp = {
  error: IDendronError;
  data?: never;
};

export type RespV3SuccessResp<T> = {
  error?: never;
  data: T;
};

/**
 * This lets us use a discriminated union to see if result has error or data
 *
 * If you need to make sure it is an error (or a success),
 * use {@link ErrorUtils.isErrorResp} type guard to help typescript narrow it down.
 */
export type RespV3<T> = RespV3ErrorResp | RespV3SuccessResp<T>;

export type RespWithOptError<T> = {
  data: T;
  error?: IDendronError;
};

/**
 * --- ENGINE OPTS
 */
export type EngineUpdateNodesOptsV2 = {
  /**
   * New Node, should add to `fullNode` cache
   */
  newNode: boolean;
};
export type EngineWriteOptsV2 = {
  /**
   * Write all children?
   * default: false
   */
  recursive?: boolean;
  /**
   * Don't bother adding parent nodes.
   * Used when importing existing notes in bulk
   */
  noAddParent?: boolean;
  /**
   * Should any configured hooks be run during the write
   */
  runHooks?: boolean;
  /**
   * If true, overwrite existing note with same fname and vault, even if note has a different id
   * Commonly used if needed to override a note id
   */
  overrideExisting?: boolean;
  /**
   * If true, write only to metadata store. Otherwise, write to metadata store and filesystem.
   */
  metaOnly?: boolean;
};

export type EngineSchemaWriteOpts = {
  /**
   * If true, write only to metadata store. Otherwise, write to metadata store and filesystem.
   */
  metaOnly?: boolean;
};

export type DEngineInitPayload = {
  notes: NotePropsByIdDict;
  wsRoot: string;
  vaults: DVault[];
  config: DendronConfig;
};
export type RenameNoteOpts = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc;
  /**
   * Flag to determine whether we should touch metadata only
   * For example, if the code comes from vscode `rename` menu option,
   * we do not want to touch the filesystem.
   * If not provided, modify both metadata and filesystem.
   */
  metaOnly?: boolean;
};

export type RenderNoteOpts = {
  id: string;
  /** Optionally, an entire note can be provided to be rendered. If provided, the engine won't look up the note by id and will instead render this note. */
  note?: NoteProps;
  /** `HTML` by default. */
  dest?: DendronASTDest;
  /** `Preview` by default. */
  flavor?: ProcFlavor;
};

export type GetNoteBlocksOpts = {
  id: string;
  filterByAnchorType?: "header" | "block";
};

export type GetDecorationsOpts = {
  id: string;
  ranges: {
    range: VSRange;
    /** The document text that corresponds to this range. This is required because otherwise there's a data race between the notes in engine updating and decorations being generated. */
    text: string;
  }[];
  /** The text of the entire document. Required because we show warnings for the whole note even if they are not a visible range. */
  text: string;
};

export type QueryNotesOpts = {
  qs: string;

  /**
   * Original query string (which can contain minor modifications such as mapping '/'->'.')
   * This string is added for sorting the lookup results when there is exact match with
   * original query. */
  originalQS: string;
  onlyDirectChildren?: boolean;
  vault?: DVault;
};

export type BulkWriteNotesOpts = {
  notes: NoteProps[];
  // If true, skips updating metadata
  skipMetadata?: boolean;
  opts?: EngineWriteOptsV2;
};

// === Engine and Store Main

export type DCommonProps = {
  wsRoot: string;
  vaults: DVault[];
};

export type NoteChangeUpdateEntry = {
  prevNote: NoteProps;
  note: NoteProps;
  status: "update";
};

export type NoteChangeEntry =
  | {
      note: NoteProps;
      status: "create" | "delete";
    }
  | NoteChangeUpdateEntry;

/** A block within a note that can be referenced using block anchors or headers. */
export type NoteBlock = {
  /** The actual text of the block. */
  text: string;
  /** The anchor for this block, if one already exists. */
  anchor?: DNoteAnchorPositioned;
  /** The position within the document at which the block is located. */
  position: Position;
  /** The type of mdast node from which this block was extracted. Useful since entire lists are a special case. */
  type: string;
};

/**
 * --- ENGINE RESPONSE TYPES
 */
// NOTES
export type GetNoteResp = RespV3<NoteProps>;
export type BulkGetNoteResp = RespWithOptError<NoteProps[]>;
export type GetNoteMetaResp = RespV3<NotePropsMeta>;
export type BulkGetNoteMetaResp = RespWithOptError<NotePropsMeta[]>;
export type FindNotesResp = NoteProps[];
export type FindNotesMetaResp = NotePropsMeta[];
/**
 * Changed notes come from the following sources:
 * - notes that were deleted (eg. note being renamed had parent that was a stub)
 * - notes that were created (eg. note being created had no existing parents)
 * - notes that have had their links re-written
 */
export type WriteNoteResp = RespV3<NoteChangeEntry[]>;
export type BulkWriteNotesResp = RespWithOptError<NoteChangeEntry[]>;
export type UpdateNoteResp = RespV2<NoteChangeEntry[]>; // TODO: remove
export type DeleteNoteResp = RespV3<NoteChangeEntry[]>;
export type QueryNotesResp = NoteProps[];
export type QueryNotesMetaResp = NotePropsMeta[];
export type RenameNoteResp = RespV3<NoteChangeEntry[]>;
export type EngineInfoResp = RespV3<{
  version: string;
}>;
export type RenderNoteResp = RespV3<string>;
export type DEngineInitResp = RespWithOptError<DEngineInitPayload>;

// This can be deleted as soon as store v2 is deleted.
export type StoreV2InitResp = RespWithOptError<
  DEngineInitPayload & { schemas: SchemaModuleDict }
>;

// SCHEMA
export type DeleteSchemaResp = DEngineInitResp;
export type GetSchemaResp = RespV3<SchemaModuleProps>;
export type WriteSchemaResp = RespV3<void>;
export type QuerySchemaResp = RespV3<SchemaModuleProps[]>;

export type GetNoteBlocksResp = RespV3<NoteBlock[]>;
export type GetDecorationsResp = RespWithOptError<{
  decorations?: Decoration[];
  diagnostics?: Diagnostic[];
}>;

// --- Common
export type DCommonMethods = {
  bulkWriteNotes: (opts: BulkWriteNotesOpts) => Promise<BulkWriteNotesResp>;

  /**
   * Write note to metadata store and/or filesystem. This will update existing note or create new if one doesn't exist.
   * If another note with same fname + vault but different id exists, then return error (otherwise overrideExisting flag is passed)
   */
  writeNote: (
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ) => Promise<WriteNoteResp>;

  writeSchema: (
    schema: SchemaModuleProps,
    opts?: EngineSchemaWriteOpts
  ) => Promise<WriteSchemaResp>;
};

// --- VSCOde

export type WorkspaceSettings = {
  folders: WorkspaceFolderRaw[];
  settings: any | undefined;
  extensions: WorkspaceExtensionSetting;
};

export type WorkspaceFolderRaw = {
  path: string;
  name?: string;
};

export interface WorkspaceFolderCode {
  /**
   * The associated uri for this workspace folder.
   *
   * *Note:* The {@link Uri}-type was intentionally chosen such that future releases of the editor can support
   * workspace folders that are not stored on the local disk, e.g. `ftp://server/workspaces/foo`.
   */
  readonly uri: URI;

  /**
   * The name of this workspace folder. Defaults to
   * the basename of its {@link Uri.path uri-path}
   */
  readonly name: string;

  /**
   * The ordinal number of this workspace folder.
   */
  readonly index: number;
}

export type WorkspaceExtensionSetting = {
  recommendations: string[];
  unwantedRecommendations: string[];
};

export type DEngine = DCommonProps &
  DCommonMethods & {
    vaults: DVault[];
    hooks: DHookDict;

    init: () => Promise<DEngineInitResp>;
    /**
     * Get NoteProps by id. If note doesn't exist, return error
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
    /**
     * Delete note from metadata store and/or filesystem. If note doesn't exist, return error
     */
    deleteNote: (
      id: string,
      opts?: EngineDeleteOpts
    ) => Promise<DeleteNoteResp>;
    deleteSchema: (
      id: string,
      opts?: EngineDeleteOpts
    ) => Promise<DeleteSchemaResp>;
    info: () => Promise<EngineInfoResp>;

    getSchema: (id: string) => Promise<GetSchemaResp>;
    querySchema: (qs: string) => Promise<QuerySchemaResp>;
    /**
     * Query for NoteProps
     */
    queryNotes: (opts: QueryNotesOpts) => Promise<QueryNotesResp>;
    /**
     * Query for NotePropsMeta
     */
    queryNotesMeta: (opts: QueryNotesOpts) => Promise<QueryNotesMetaResp>;
    /**
     * Rename note from old DNoteLoc to new DNoteLoc. New note keeps original id
     */
    renameNote: (opts: RenameNoteOpts) => Promise<RenameNoteResp>;
    renderNote: (opts: RenderNoteOpts) => Promise<RenderNoteResp>;
    getNoteBlocks: (opts: GetNoteBlocksOpts) => Promise<GetNoteBlocksResp>;

    // ui offloading
    /** Make sure to call this with plain VSRange and not vscode.Range objects, which can't make it across to the API */
    getDecorations: (opts: GetDecorationsOpts) => Promise<GetDecorationsResp>;
  };

/**
 * Implements the engine interface but has no backend store
 *  ^sdxp5tjokad9
 */
export type DEngineClient = Omit<DEngine, "store">;

export type DStore = DCommonProps &
  DCommonMethods & {
    /**
     * @deprecated
     * For access, see {@link DEngine.getNote}
     * Dictionary where key is the note id.
     */
    notes: NotePropsByIdDict;
    /**
     * @deprecated
     * For access, see {@link DEngine.findNotes}
     * Dictionary where the key is lowercase note fname, and values are ids of notes with that fname (multiple ids since there might be notes with same fname in multiple vaults).
     */
    noteFnames: NotePropsByFnameDict;
    init: () => Promise<StoreV2InitResp>;
    /**
     * Get NoteProps by id. If note doesn't exist, return error
     */
    getNote: (id: string) => Promise<GetNoteResp>;

    getSchema: (id: string) => Promise<GetSchemaResp>;
    /**
     * @deprecated: Use {@link DEngine.writeNote}
     * @param note
     * @param opts
     * @returns The updated note. If `newNode` is set, this will have the updated parent id
     */
    updateNote(
      note: NoteProps,
      opts?: EngineUpdateNodesOptsV2
    ): Promise<UpdateNoteResp>;

    /**
     * Find NoteProps by note properties. If no notes match, return empty list
     */
    findNotes: (opts: FindNoteOpts) => Promise<FindNotesResp>;
    deleteNote: (
      id: string,
      opts?: EngineDeleteOpts
    ) => Promise<NoteChangeEntry[]>;
    deleteSchema: (
      id: string,
      opts?: EngineDeleteOpts
    ) => Promise<DeleteSchemaResp>;
    renameNote: (opts: RenameNoteOpts) => Promise<NoteChangeEntry[]>;
  };

// === Workspace

export type WorkspaceVault = {
  wsRoot: string;
  vault: DVault;
};

export type WorkspaceOpts = {
  wsRoot: string;
  vaults: DVault[];
  dendronConfig?: DendronConfig;
};

// === Pods
export type DPod<TConfig> = {
  config: any;
  execute(opts: BasePodExecuteOpts<TConfig>): Promise<any>;
};

export type PodConfig = {
  key: string;
  description: string;
  type: "string" | "number" | "boolean" | "object";
  required?: boolean;
  default?: any;
  example?: string;
};

export type BasePodExecuteOpts<TConfig> = {
  config: TConfig;
  engine: DEngineClient;
  wsRoot: string;
  vaults: DVault[];
  utilityMethods?: any;
};

export enum MergeConflictOptions {
  OVERWRITE_LOCAL = "Overwrite local value with remote value",
  OVERWRITE_REMOTE = "Overwrite remote value with local value",
  SKIP = "Skip this conflict(We will not merge, you'll resolve this manually)",
  SKIP_ALL = "Skip All (you'll resolve all next conflicted entries manually) ",
}

export type Conflict = {
  /**
   * Existing note
   */
  conflictNote: NoteProps;
  /**
   * Newly written note
   */
  conflictEntry: NoteProps;
  /**
   * Conflicted Data
   */
  conflictData: string[];
};

export type PodConflictResolveOpts = {
  options: () => string[];
  message: (conflict: Conflict) => string;
  validate: (choice: number, options: string[]) => any;
};
// --- Messages

export type DMessage<TType = string, TData = any, TSource = DMessageSource> = {
  type: TType; // "onDidChangeActiveTextEditor"
  data: TData;
  source: TSource;
};

export enum DMessageSource {
  vscode = "vscode",
  webClient = "webClient",
}

export enum DMessageEnum {
  /**
   * View is ready
   */
  INIT = "init",
  ON_DID_CHANGE_ACTIVE_TEXT_EDITOR = "onDidChangeActiveTextEditor",
  ON_UPDATE_PREVIEW_HTML = "onUpdatePreviewHTML",
  MESSAGE_DISPATCHER_READY = "messageDispatcherReady",
}

export enum GraphViewMessageEnum {
  "onSelect" = "onSelect",
  "onGetActiveEditor" = "onGetActiveEditor",
  "onReady" = "onReady",
  "onRequestGraphOpts" = "onRequestGraphOpts",
  "onGraphLoad" = "onGraphLoad",
  "onGraphThemeChange" = "onGraphThemeChange",
  "configureCustomStyling" = "configureCustomStyling",
  "toggleGraphView" = "toggleGraphView",
  "onGraphDepthChange" = "onGraphDepthChange",
  "toggleGraphEdges" = "toggleGraphEdges",
}

export enum CalendarViewMessageType {
  "onSelect" = "onSelect",
  "onGetActiveEditor" = "onGetActiveEditor",
  "messageDispatcherReady" = "messageDispatcherReady",
}

export enum NoteViewMessageEnum {
  "onClick" = "onClick",
  "onGetActiveEditor" = "onGetActiveEditor",
  "onLock" = "onLock",
  "onUnlock" = "onUnlock",
}

export enum LookupViewMessageEnum {
  "onUpdate" = "onUpdate",
  "onValuesChange" = "onValuesChange",
  "onRequestControllerState" = "onRequestControllerState",
}

export enum ThemeMessageType {
  "onThemeChange" = "onThemeChange",
  "getTheme" = "getTheme",
}

export enum SeedBrowserMessageType {
  "onSeedAdd" = "onSeedAdd",
  "onOpenUrl" = "onOpenUrl",
  "onSeedStateChange" = "onSeedStateChange",
}

export enum ConfigureUIMessageEnum {
  "onUpdateConfig" = "onUpdateConfig",
  "openDendronConfigYaml" = "openDendronConfigYaml",
}

export enum GraphThemeEnum {
  Block = "Block",
  Classic = "Classic",
  Monokai = "Monokai",
  Custom = "Custom",
}

export enum GraphTypeEnum {
  fullGraph = "fullGraph",
  localGraph = "localGraph",
}

// TODO: split this up into a separate command, i.e. onNoteStateChanged, to capture different use cases
export type OnDidChangeActiveTextEditorData = {
  note: NoteProps | undefined;
  /**
   * Sync all notes
   */
  sync?: boolean;
  /**
   * Sync the changed note
   */
  syncChangedNote?: boolean;
  /**
   * Current active note.
   * If activeNote is defined, view will set that note as active note. Otherwise default to {@param note}
   */
  activeNote?: NoteProps;
};

export type OnUpdatePreviewHTMLData = {
  note: NoteProps; // TODO: Change to NotePropsMeta
  html: string;
};

export type NoteViewMessageType = DMessageEnum | NoteViewMessageEnum;

export type GraphViewMessageType = DMessageEnum | GraphViewMessageEnum;

export type ConfigureUIMessageType = DMessageEnum | ConfigureUIMessageEnum;

export type VSCodeMessage = DMessage;
export type OnDidChangeActiveTextEditorMsg = DMessage<
  "onDidChangeActiveTextEditor",
  OnDidChangeActiveTextEditorData
>;

export type OnUpdatePreviewHTMLMsg = DMessage<
  DMessageEnum.ON_UPDATE_PREVIEW_HTML,
  OnUpdatePreviewHTMLData
>;

export type GraphViewMessage = DMessage<
  GraphViewMessageType,
  {
    id: string;
    vault?: string;
    graphTheme?: GraphThemeEnum;
    graphType?: GraphTypeEnum;
    graphDepth?: number;
  }
>;

export type ConfigureUIMessage = DMessage<
  ConfigureUIMessageType,
  {
    config: DendronConfig;
  }
>;

export type CalendarViewMessage = DMessage<
  CalendarViewMessageType,
  { id?: string; fname?: string }
>;

export type NoteViewMessage = DMessage<
  NoteViewMessageType,
  { id?: string; href?: string }
>;

export type SeedBrowserMessage = DMessage<
  SeedBrowserMessageType | DMessageEnum,
  { data: any }
>;

export type LookupViewMessage = DMessage<LookupViewMessageEnum, any>;

// from https://stackoverflow.com/questions/48011353/how-to-unwrap-the-type-of-a-promise
// use to unwrap promise of return type. can be removed once we upgrade to typescript 4.5 (will be included in typescript library)
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
