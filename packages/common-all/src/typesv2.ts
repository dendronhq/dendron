import { URI } from "vscode-uri";
import { DendronError } from "./error";
import { DendronConfig, DendronSiteFM } from "./types";

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
   * If node is deleted and parents are stubs, default behavior is to alsod elete parents
   */
  noDeleteParentStub?: boolean;
};

export type SchemaData = {
  namespace?: boolean;
  pattern?: string;
  template?: SchemaTemplate;
};

export type SchemaTemplate = {
  id: string;
  type: "snippet" | "note";
};

export type NoteLink = {
  type: "note";
  id: string;
};

// === New
export type DNodePointer = string;

export type DLoc = {
  fname?: string;
  id?: string;
  vault?: DVault;
  uri?: URI;
  anchorHeader?: string;
};
export type DNoteLoc = {
  fname: string;
  alias?: string;
  id?: string;
  vault?: DVault;
  anchorHeader?: string;
};

export type DNoteAnchor = {
  /**
   * In the future, we could have ID based anchors
   */
  type: "header";
  value: string;
};
export type VaultRemote = {
  type: "git";
  url: string;
};
export enum DVaultVisibility {
  PRIVATE = "private",
}

export type DVault = {
  /** Name of vault */
  name?: string;
  visibility?: DVaultVisibility;
  /** Filesystem path to fault */
  fsPath: string;
  // /**
  //  * Uri which is relative from root
  //  */
  // uri: string;
  remote?: VaultRemote;
  userPermission?: DPermission;
  /**
   * If this is enabled, don't apply workspace push commands
   */
  noAutoPush?: boolean;
};

export type DPermission = {
  read: string[];
  write: string[];
};

export type DLinkType = "wiki" | "refv2";

export type DLink = {
  type: "ref" | "wiki" | "md" | "backlink";
  original: string;
  value: string;
  alias?: string;
  pos: {
    start: number;
    end: number;
  };
  from: DLoc;
  to?: DLoc;
};
export type DNoteLink<TData = any> = {
  type: "ref" | "wiki" | "md";
  pos?: {
    start: number;
    end: number;
  };
  from: DNoteLoc;
  to?: DNoteLoc;
  data: TData;
};
export type DNodeType = "note" | "schema";
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
};
export type DNoteRefLink = DNoteLink<DNoteRefData>;

/**
 * Props are the official interface for a node
 */
export type DNodeProps<T = any, TCustom = any> = {
  id: string;
  title: string;
  desc: string;
  links: DLink[];
  fname: string;
  type: DNodeType;
  updated: number;
  created: number;
  stub?: boolean;
  schemaStub?: boolean;
  parent: DNodePointer | null;
  children: DNodePointer[];
  data: T;
  body: string;
  custom?: TCustom;
  schema?: { moduleId: string; schemaId: string };
  vault: DVault;
};

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

export type SchemaProps = DNodeProps<SchemaData>;
export type NoteProps = DNodeProps<any, DendronSiteFM & any>;

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

// ---

export type SchemaImport = string[];
export type SchemaModuleOpts = {
  version: number;
  imports?: SchemaImport;
  schemas: SchemaOpts[];
};

export type SchemaModuleProps = {
  version: number;
  imports?: SchemaImport;
  schemas: SchemaPropsDict;
  root: SchemaProps;
  fname: string;
  vault: DVault;
};

// === Engine

export interface RespV2<T> {
  data?: T;
  error: DendronError | null;
}

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
} & Partial<EngineUpdateNodesOptsV2>;

export type DEngineInitPayload = {
  notes: NotePropsDict;
  schemas: SchemaModuleDict;
};
export type RenameNoteOpts = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc;
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
  vaultsv3: DVault[];
  links: DLink[];
  config: DendronConfig;
};

export type NoteChangeEntry = {
  note: NoteProps;
  status: "create" | "update" | "delete";
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

export type DEngineInitResp = Required<RespV2<DEngineInitPayload>>;
export type EngineDeleteNotePayload = NoteChangeEntry[];
// TODO: KLUDGE
export type DEngineDeleteSchemaPayload = DEngineInitPayload;
export type DEngineDeleteSchemaResp = DEngineInitResp;
export type EngineInfoResp = {
  version: string;
};
// --- KLUDGE END

export type EngineDeleteNoteResp = Required<RespV2<EngineDeleteNotePayload>>;
export type EngineQueryNoteResp = Required<RespV2<DNodeProps[]>>;
export type NoteQueryResp = Required<RespV2<NoteProps[]>>;
export type SchemaQueryResp = Required<RespV2<SchemaModuleProps[]>>;
export type StoreDeleteNoteResp = EngineDeleteNotePayload;
export type RenameNotePayload = NoteChangeEntry[];

export type GetNotePayload = {
  note: NoteProps | undefined;
  changed: NoteChangeEntry[];
};
export type QueryNotesOpts = {
  qs: string;
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

    // config
    writeConfig: (opts: ConfigWriteOpts) => Promise<RespV2<void>>;
    getConfig: () => Promise<RespV2<ConfigGetPayload>>;
  };

export type DEngineClientV2 = Omit<DEngine, "store">;

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
};

/**
 * Used to specify exact location of a note
 */
export type GetNoteOpts = {
  fname: string;
} & WorkspaceVault;

// === Pods
export type DPod<TConfig> = {
  config: PodConfig[];
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
  engine: DEngineClientV2;
  wsRoot: string;
  vaults: DVault[];
};
