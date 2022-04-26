import { URI } from "vscode-uri";
import { DendronError, IDendronError } from "../error";
import {
  DLink,
  DNodeProps,
  DNodeType,
  NoteProps,
  Position,
  SchemaData,
  SchemaProps,
} from "./foundation";
import { DHookDict } from "./hooks";
import { DVault } from "./workspace";
import { IntermediateDendronConfig } from "./intermediateConfigs";
import { VSRange } from "./compat";
import { Decoration, Diagnostic } from ".";
import type { NoteFNamesDict, Optional } from "../utils";
import { DendronASTDest, ProcFlavor } from "./unified";
import { GetAnchorsRequest, GetLinksRequest } from "..";

export enum ResponseCode {
  OK = 200,
  // 412
  PRECONDITION_FAILED = 412,
}

export type EngineDeleteOpts = {
  /**
   * Only delete from meta
   */
  metaOnly?: boolean;
  /**
   * If node is deleted and parents are stubs, default behavior is to alsod delete parents
   */
  noDeleteParentStub?: boolean;
  /**
   * If the deleted note has children, replace the deleted note with a newly created stub note in place.
   */
  replaceWithNewStub?: boolean;
};

export type NoteLink = {
  type: "note";
  id: string;
};

// === New

export type DNoteLoc = {
  fname: string;
  alias?: string;
  id?: string;
  vaultName?: string;
  anchorHeader?: string;
};

export type DNoteAnchor =
  | DNoteBlockAnchor
  | DNoteHeaderAnchor
  | DNoteLineAnchor;

/**
 * Anchor without {@link DNoteHeaderAnchor.depth} info
 * @todo see migration [[DNoteAnchorBasic|dendron://dendron.docs/dev.changelog#dnoteanchorbasic]]
 */
export type DNoteAnchorBasic =
  | DNoteBlockAnchor
  | Omit<DNoteHeaderAnchor, "depth">
  | DNoteLineAnchor;

export type DNoteBlockAnchor = {
  type: "block";
  text?: string; //original text for the anchor
  value: string;
};

/**
 * This represents a markdown header
 * ```md
 * # H1
 * ```
 */
export type DNoteHeaderAnchor = {
  type: "header";
  text?: string; //original text for the anchor
  value: string;
  depth: number;
};

/** An anchor referring to a specific line in a file. These don't exist inside of files, they are implied by the link containing the anchor.
 *
 * Lines are indexed starting at 1, which is similar to how you refer to specific lines on Github.
 */
export type DNoteLineAnchor = {
  type: "line";
  /** 1-indexed line number. */
  line: number;
  value: string;
};

export type DNoteAnchorPositioned = (DNoteBlockAnchor | DNoteHeaderAnchor) & {
  line: number;
  column: number;
};

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

export type DNoteLinkRaw<TData = any> = Omit<DNoteLink<TData>, "from"> & {
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

export type SchemaOpts = Omit<DNodeOpts<SchemaData>, "type" | "id"> & {
  id: string;
};
export type NoteOpts = Omit<DNodeOpts, "type">;

export type DNodePropsQuickInputV2<T = any> = DNodeProps<T> & {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};
export type NoteQuickInput = NoteProps & {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};

export type DNodePropsDict = {
  [key: string]: DNodeProps;
};

export type NotePropsDict = {
  [key: string]: NoteProps;
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

/**
 * This lets us use a discriminate union to see if result has error or data
 */
export type RespV3<T> =
  | {
      error: IDendronError;
      data?: never;
    }
  | {
      error?: never;
      data: T;
    };

export type BooleanResp =
  | { data: true; error: null }
  | { data: false; error: DendronError };

export function isDendronResp<T = any>(args: any): args is RespV2<T> {
  return args?.error instanceof DendronError;
}

/**
 * @deprecated - use RespV2<T> instead.
 */
export type RespRequired<T> =
  | {
      error: null | undefined;
      data: T;
    }
  | { error: DendronError; data: undefined };

export interface QueryOptsV2 {
  /**
   * Should add to full nodes
   */
  fullNode?: boolean;
  /**
   * Just get one result
   */
  queryOne?: boolean;
  /**
   * If node does not exist, create it?
   */
  createIfNew?: boolean;
}

export type EngineUpdateNodesOptsV2 = {
  /**
   * New Node, should add to `fullNode` cache
   */
  newNode: boolean;
};
export type GetNoteOptsV2 = {
  vault: DVault;
  /**
   * Note file name minus the extension
   */
  npath: string;
  /**
   * If node does not exist, create it?
   */
  createIfNew?: boolean;
  /**
   * Override any props
   */
  overrides?: Partial<NoteProps>;
};
export type EngineDeleteOptsV2 = EngineDeleteOpts;
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
   * Should update existing note instead of overwriting
   */
  updateExisting?: boolean;
  /**
   * Should any configured hooks be run during the write
   */
  runHooks?: boolean;
} & Partial<EngineUpdateNodesOptsV2>;

export type DEngineInitPayload = {
  notes: NotePropsDict;
  schemas: SchemaModuleDict;
  wsRoot: string;
  vaults: DVault[];
  config: IntermediateDendronConfig;
};
export type RenameNoteOpts = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc;
  /**
   * added for dendron to recognise vscode `rename` menu option
   */
  isEventSourceEngine?: boolean;
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

export type RefreshNotesOpts = {
  notes: NoteChangeEntry[];
};

export type GetNoteBlocksOpts = {
  id: string;
  filterByAnchorType?: "header" | "block";
};

export type ConfigWriteOpts = {
  config: IntermediateDendronConfig;
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

// === Engine and Store Main

export type DCommonProps = {
  /** Dictionary where key is the note id. */
  notes: NotePropsDict;
  /** Dictionary where the key is lowercase note fname, and values are ids of notes with that fname (multiple ids since there might be notes with same fname in multiple vaults). */
  noteFnames: NoteFNamesDict;
  schemas: SchemaModuleDict;
  wsRoot: string;
  /**
   * NOTE: currently same as wsRoot. in the future, the two will be decoupled
   */
  configRoot: string;
  vaults: DVault[];
  links: DLink[];
  config: IntermediateDendronConfig;
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
 * Returns list of notes that were changed
 */
export type WriteNoteResp = Required<RespV2<NoteChangeEntry[]>>;

// --- Common
export type ConfigGetPayload = IntermediateDendronConfig;

export type DCommonMethods = {
  bulkAddNotes: (
    opts: BulkAddNoteOpts
  ) => Promise<Required<RespV2<NoteChangeEntry[]>>>;
  // TODO
  // configGet(): RespV2<ConfigGetPayload>
  /**
   *
   * @param note
   * @param opts
   * @returns The updated note. If `newNode` is set, this will have the updated parent id
   */
  updateNote(
    note: NoteProps,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<NoteProps>;
  updateSchema: (schema: SchemaModuleProps) => Promise<void>;

  writeNote: (
    note: NoteProps,
    opts?: EngineWriteOptsV2
  ) => Promise<WriteNoteResp>;

  writeSchema: (schema: SchemaModuleProps) => Promise<void>;
};

// --- Engine

export type DEngineInitResp = RespV2<DEngineInitPayload>;
export type EngineDeleteNotePayload = NoteChangeEntry[];
// TODO: KLUDGE
export type DEngineDeleteSchemaPayload = DEngineInitPayload;
export type DEngineDeleteSchemaResp = DEngineInitResp;
export type EngineInfoResp = {
  version: string;
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

// --- KLUDGE END

export type EngineDeleteNoteResp = Required<RespV2<EngineDeleteNotePayload>>;
export type NoteQueryResp = Required<RespV2<NoteProps[]>>;
export type SchemaQueryResp = Required<RespV2<SchemaModuleProps[]>>;
export type StoreDeleteNoteResp = EngineDeleteNotePayload;
/**
 * Changed notes come from the following sources:
 * - notes that were deleted (eg. note being renamed had parent that was a stub)
 * - notes that were created (eg. note being created had no existing parents)
 * - notes that have had their links re-written
 */
export type RenameNotePayload = NoteChangeEntry[];
export type RenderNotePayload = string | undefined;
export type GetNoteBlocksPayload = RespV2<NoteBlock[]>;
export type GetDecorationsPayload = RespV2<{
  decorations?: Decoration[];
  diagnostics?: Diagnostic[];
}>;
export type GetNoteLinksPayload = RespV2<DLink[]>;
export type GetAnchorsResp = { [index: string]: DNoteAnchorPositioned };
export type GetNoteAnchorsPayload = RespV2<GetAnchorsResp>;

export type GetNotePayload = {
  note: NoteProps | undefined;
  changed: NoteChangeEntry[];
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
  createIfNew?: boolean;
};

export type DEngineInitSchemaResp = Required<RespV2<SchemaModuleProps[]>>;

export type DEngineSyncOpts = {
  metaOnly?: boolean;
};

export type BulkAddNoteOpts = {
  notes: NoteProps[];
};

export type DEngine = DCommonProps &
  DCommonMethods & {
    store: DStore;
    vaults: DVault[];
    hooks: DHookDict;

    init: () => Promise<DEngineInitResp>;
    deleteNote: (
      id: string,
      opts?: EngineDeleteOptsV2
    ) => Promise<EngineDeleteNoteResp>;
    deleteSchema: (
      id: string,
      opts?: EngineDeleteOptsV2
    ) => Promise<DEngineDeleteSchemaResp>;
    info: () => Promise<RespRequired<EngineInfoResp>>;
    sync: (opts?: DEngineSyncOpts) => Promise<DEngineInitResp>;

    getNoteByPath: (opts: GetNoteOptsV2) => Promise<RespV2<GetNotePayload>>;
    getSchema: (qs: string) => Promise<RespV2<SchemaModuleProps>>;
    querySchema: (qs: string) => Promise<SchemaQueryResp>;
    queryNotes: (opts: QueryNotesOpts) => Promise<NoteQueryResp>;
    queryNotesSync({
      qs,
      originalQS,
    }: {
      qs: string;
      originalQS: string;
      vault?: DVault;
    }): NoteQueryResp;
    renameNote: (opts: RenameNoteOpts) => Promise<RespV2<RenameNotePayload>>;
    renderNote: (opts: RenderNoteOpts) => Promise<RespV2<RenderNotePayload>>;
    /**
     * Update note metadata.
     * Use cases:
     * - update notes if they've been changed outside of Dendron
     */
    refreshNotes: (opts: RefreshNotesOpts) => Promise<RespV2<void>>;
    getNoteBlocks: (opts: GetNoteBlocksOpts) => Promise<GetNoteBlocksPayload>;

    // config
    writeConfig: (opts: ConfigWriteOpts) => Promise<RespV2<void>>;
    getConfig: () => Promise<RespV2<ConfigGetPayload>>;

    // ui offloading
    /** Make sure to call this with plain VSRange and not vscode.Range objects, which can't make it across to the API */
    getDecorations: (
      opts: GetDecorationsOpts
    ) => Promise<GetDecorationsPayload>;
    getLinks: (
      opts: Optional<GetLinksRequest, "ws">
    ) => Promise<GetNoteLinksPayload>;
    getAnchors: (opts: GetAnchorsRequest) => Promise<GetNoteAnchorsPayload>;
  };

/**
 * Implements the engine interface but has no backend store
 *  ^sdxp5tjokad9
 */
export type DEngineClient = Omit<DEngine, "store">;

export type DStore = DCommonProps &
  DCommonMethods & {
    init: () => Promise<DEngineInitResp>;
    deleteNote: (
      id: string,
      opts?: EngineDeleteOptsV2
    ) => Promise<StoreDeleteNoteResp>;
    deleteSchema: (
      id: string,
      opts?: EngineDeleteOptsV2
    ) => Promise<DEngineDeleteSchemaResp>;
    renameNote: (opts: RenameNoteOpts) => Promise<RenameNotePayload>;
  };

// TODO: not used yet
export type DEngineV4 = {
  // Properties
  notes: NotePropsDict;
  schemas: SchemaModuleDict;
  wsRoot: string;
  vaults: DVault[];
  initialized: boolean;
} & DEngineV4Methods;

export type DEngineV4Methods = {
  init: () => Promise<DEngineInitResp>;
  deleteNote: (
    id: string,
    opts?: EngineDeleteOptsV2
  ) => Promise<EngineDeleteNoteResp>;
  deleteSchema: (
    id: string,
    opts?: EngineDeleteOptsV2
  ) => Promise<DEngineDeleteSchemaResp>;
  sync: (opts?: DEngineSyncOpts) => Promise<DEngineInitResp>;

  getNoteByPath: (opts: GetNoteOptsV2) => Promise<RespV2<GetNotePayload>>;
  getSchema: (qs: string) => Promise<RespV2<SchemaModuleProps>>;
  querySchema: (qs: string) => Promise<SchemaQueryResp>;
  queryNotes: (opts: QueryNotesOpts) => Promise<NoteQueryResp>;
  queryNotesSync({ qs }: { qs: string }): NoteQueryResp;
  renameNote: (opts: RenameNoteOpts) => Promise<RespV2<RenameNotePayload>>;
  getNoteBlocks: (opts: GetNoteBlocksOpts) => Promise<GetNoteBlocksPayload>;

  // config
  writeConfig: (opts: ConfigWriteOpts) => Promise<RespV2<void>>;
  getConfig: () => Promise<RespV2<ConfigGetPayload>>;

  // ui offloading
  getDecorations: (opts: GetDecorationsOpts) => Promise<GetDecorationsPayload>;
};

// === Workspace

export type WorkspaceVault = {
  wsRoot: string;
  vault: DVault;
};

export type WorkspaceOpts = {
  wsRoot: string;
  vaults: DVault[];
  dendronConfig?: IntermediateDendronConfig;
};

/**
 * Used to specify exact location of a note
 */
export type GetNoteOpts = {
  fname: string;
} & WorkspaceVault;

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
  MESSAGE_DISPATCHER_READY = "messageDispatcherReady",
}

/** @deprecated: Tree view v2 is deprecated */
export enum TreeViewMessageEnum {
  "onSelect" = "onSelect",
  "onExpand" = "onExpand",
  "onGetActiveEditor" = "onGetActiveEditor",
  /**
   * View is ready
   */
  "onReady" = "onReady",
}
export enum GraphViewMessageEnum {
  "onSelect" = "onSelect",
  "onGetActiveEditor" = "onGetActiveEditor",
  "onReady" = "onReady",
  "onRequestGraphStyle" = "onRequestGraphStyle",
  "onGraphStyleLoad" = "onGraphStyleLoad",
  "onGraphThemeChange" = "onGraphThemeChange",
  "onRequestDefaultGraphTheme" = "onRequestDefaultGraphTheme",
  "onDefaultGraphThemeLoad" = "onDefaultGraphThemeLoad",
}

export enum CalendarViewMessageType {
  "onSelect" = "onSelect",
  "onGetActiveEditor" = "onGetActiveEditor",
  "messageDispatcherReady" = "messageDispatcherReady",
}

export enum NoteViewMessageEnum {
  "onClick" = "onClick",
  "onGetActiveEditor" = "onGetActiveEditor",
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

export enum GraphThemeEnum {
  Block = "Block",
  Classic = "Classic",
  Monokai = "Monokai",
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

export type NoteViewMessageType = DMessageEnum | NoteViewMessageEnum;

export type GraphViewMessageType = DMessageEnum | GraphViewMessageEnum;

/** @deprecated: Tree view v2 is deprecated */
export type TreeViewMessageType = DMessageEnum | TreeViewMessageEnum;

export type VSCodeMessage = DMessage;
export type OnDidChangeActiveTextEditorMsg = DMessage<
  "onDidChangeActiveTextEditor",
  OnDidChangeActiveTextEditorData
>;

export type GraphViewMessage = DMessage<
  GraphViewMessageType,
  { id: string; vault?: string; defaultGraphTheme?: GraphThemeEnum }
>;

export type CalendarViewMessage = DMessage<
  CalendarViewMessageType,
  { id?: string; fname?: string }
>;

export type NoteViewMessage = DMessage<
  NoteViewMessageType,
  { id?: string; href?: string }
>;

/** @deprecated: Tree view v2 is deprecated */
export type TreeViewMessage = DMessage<TreeViewMessageType, { id: string }>;

export type SeedBrowserMessage = DMessage<
  SeedBrowserMessageType | DMessageEnum,
  { data: any }
>;

export type LookupViewMessage = DMessage<LookupViewMessageEnum, any>;

// from https://stackoverflow.com/questions/48011353/how-to-unwrap-the-type-of-a-promise
// use to unwrap promise of return type. can be removed once we upgrade to typescript 4.5 (will be included in typescript library)
export type Awaited<T> = T extends PromiseLike<infer U> ? U : T;
