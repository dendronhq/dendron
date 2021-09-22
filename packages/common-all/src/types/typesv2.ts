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
import { DendronConfig, DVault } from "./workspace";

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

export type DNoteAnchor = {
  /**
   * In the future, we could have ID based anchors
   */
  type: "header" | "block";
  value: string;
};

export type DNoteAnchorPositioned = DNoteAnchor & {
  line: number;
  column: number;
};

export type DLinkType = "wiki" | "refv2";

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
   * Should persist hierarchy information to disk
   */
  writeHierarchy?: boolean;
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
  config: DendronConfig;
};
export type RenameNoteOpts = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc;
};

export type RenderNoteOpts = {
  id: string;
};

export type GetNoteBlocksOpts = {
  id: string;
  filterByAnchorType?: "header" | "block";
};

export type ConfigWriteOpts = {
  config: DendronConfig;
};

// === Engine and Store Main

export type DCommonProps = {
  notes: NotePropsDict;
  schemas: SchemaModuleDict;
  wsRoot: string;
  /**
   * NOTE: currently same as wsRoot. in the future, the two will be decoupled
   */
  configRoot: string;
  vaults: DVault[];
  links: DLink[];
  config: DendronConfig;
};

export type NoteChangeEntry = {
  note: NoteProps;
  status: "create" | "update" | "delete";
};

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
export type ConfigGetPayload = DendronConfig;

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

export type GetNotePayload = {
  note: NoteProps | undefined;
  changed: NoteChangeEntry[];
};
export type QueryNotesOpts = {
  qs: string;
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
    queryNotesSync({ qs }: { qs: string; vault?: DVault }): NoteQueryResp;
    renameNote: (opts: RenameNoteOpts) => Promise<RespV2<RenameNotePayload>>;
    renderNote: (opts: RenderNoteOpts) => Promise<RespV2<RenderNotePayload>>;
    getNoteBlocks: (opts: GetNoteBlocksOpts) => Promise<GetNoteBlocksPayload>;

    // config
    writeConfig: (opts: ConfigWriteOpts) => Promise<RespV2<void>>;
    getConfig: () => Promise<RespV2<ConfigGetPayload>>;
  };

/**
 * Implements the engine interface but has no backend store
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

export enum DMessageType {
  INIT = "init",
  ON_DID_CHANGE_ACTIVE_TEXT_EDITOR = "onDidChangeActiveTextEditor",
  MESSAGE_DISPATCHER_READY = "messageDispatcherReady",
}

export enum TreeViewMessageType {
  "onSelect" = "onSelect",
  "onExpand" = "onExpand",
  "onGetActiveEditor" = "onGetActiveEditor",
  /**
   * View is ready
   */
  "onReady" = "onReady",
}
export enum GraphViewMessageType {
  "onSelect" = "onSelect",
  "onGetActiveEditor" = "onGetActiveEditor",
  "onReady" = "onReady",
  "onRequestGraphStyle" = "onRequestGraphStyle",
}

export enum CalendarViewMessageType {
  "onSelect" = "onSelect",
  "onGetActiveEditor" = "onGetActiveEditor",
  "messageDispatcherReady" = "messageDispatcherReady",
}

export enum NoteViewMessageType {
  "onClick" = "onClick",
  "onGetActiveEditor" = "onGetActiveEditor",
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
};

export type VSCodeMessage = DMessage;
export type OnDidChangeActiveTextEditorMsg = DMessage<
  "onDidChangeActiveTextEditor",
  OnDidChangeActiveTextEditorData
>;

export type TreeViewMessage = DMessage<TreeViewMessageType, { id: string }>;
export type GraphViewMessage = DMessage<
  GraphViewMessageType,
  { id: string; vault?: string }
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
  SeedBrowserMessageType | DMessageType,
  { data: any }
>;

// --- Views

export enum DendronWebViewKey {
  CONFIGURE = "dendron.configure",
  NOTE_GRAPH = "dendron.graph-note",
  SCHEMA_GRAPH = "dendron.graph-schema",
  NOTE_PREVIEW = "dendron.note-preview",
  SEED_BROWSER = "dendron.seed-browser",
}

export enum DendronTreeViewKey {
  SAMPLE_VIEW = "dendron.sample",
  TREE_VIEW = "dendron.treeView",
  TREE_VIEW_V2 = "dendron.tree-view",
  BACKLINKS = "dendron.backlinks",
  CALENDAR_VIEW = "dendron.calendar-view",
}
