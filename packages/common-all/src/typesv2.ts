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
export type DNodePointerV2 = string;

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
export type DNodeTypeV2 = "note" | "schema";
export type DNoteRefData = {
  anchorStart?: string;
  anchorEnd?: string;
  anchorStartOffset?: number;
  /**
   * File link: wiki based links (eg. [[foo]])
   * Id link: TBD (eg. ^1234)
   */
  type: "file" | "id";
};
export type DNoteRefLink = DNoteLink<DNoteRefData>;

export type SchemaDataV2 = SchemaData;

/**
 * Props are the official interface for a node
 */
export type DNodePropsV2<T = any, TCustom = any> = {
  id: string;
  title: string;
  desc: string;
  links: DLink[];
  fname: string;
  type: DNodeTypeV2;
  updated: string;
  created: string;
  stub?: boolean;
  schemaStub?: boolean;
  parent: DNodePointerV2 | null;
  children: DNodePointerV2[];
  data: T;
  body: string;
  custom?: TCustom;
  schema?: { moduleId: string; schemaId: string };
  vault: DVault;
};

/**
 * Opts are arguments used when creating a node
 */
export type DNodeOptsV2<T = any> = Partial<
  Omit<DNodePropsV2<T>, "fname|type|vault">
> & { fname: string; type: DNodeTypeV2; vault: DVault };

export type SchemaRawV2 = Pick<SchemaPropsV2, "id"> &
  Partial<SchemaDataV2> & { title?: string; desc?: string } & Partial<
    Pick<DNodePropsV2, "children">
  >;

export type SchemaOptsV2 = Omit<DNodeOptsV2<SchemaData>, "type" | "id"> & {
  id: string;
};
export type NoteOptsV2 = Omit<DNodeOptsV2, "type">;

export type DNodePropsQuickInputV2<T = any> = DNodePropsV2<T> & {
  label: string;
  detail?: string;
  alwaysShow?: boolean;
};

export type SchemaPropsV2 = DNodePropsV2<SchemaData>;
export type NotePropsV2 = DNodePropsV2<any, DendronSiteFM & any>;

export type DNodePropsDictV2 = {
  [key: string]: DNodePropsV2;
};

export type NotePropsDictV2 = {
  [key: string]: NotePropsV2;
};

export type SchemaPropsDictV2 = {
  [key: string]: SchemaPropsV2;
};

export type SchemaModuleDictV2 = {
  [key: string]: SchemaModulePropsV2;
};

// ---

export type SchemaImportV2 = string[];
export type SchemaModuleOptsV2 = {
  version: number;
  imports?: SchemaImportV2;
  schemas: SchemaOptsV2[];
};

export type SchemaModulePropsV2 = {
  version: number;
  imports?: SchemaImportV2;
  schemas: SchemaPropsDictV2;
  root: SchemaPropsV2;
  fname: string;
  vault: DVault;
};

// === Engine

export interface RespV2<T> {
  data?: T;
  error: DendronError | null;
}

export type RespRequiredV2<T> =
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
  overrides?: Partial<NotePropsV2>;
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

export type DEngineInitPayloadV2 = {
  notes: NotePropsDictV2;
  schemas: SchemaModuleDictV2;
};
export type RenameNoteOptsV2 = {
  oldLoc: DNoteLoc;
  newLoc: DNoteLoc;
};

export type ConfigWriteOpts = {
  config: DendronConfig;
};

// === Engine and Store Main

export type DCommonProps = {
  notes: NotePropsDictV2;
  schemas: SchemaModuleDictV2;
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
  note: NotePropsV2;
  status: "create" | "update" | "delete";
};
/**
 * Returns list of notes that were changed
 */
export type WriteNoteResp = Required<RespV2<NoteChangeEntry[]>>;

// --- Common
export type ConfigGetPayload = DendronConfig;

export type DCommonMethods = {
  // TODO
  // configGet(): RespV2<ConfigGetPayload>
  updateNote(note: NotePropsV2, opts?: EngineUpdateNodesOptsV2): Promise<void>;
  updateSchema: (schema: SchemaModulePropsV2) => Promise<void>;

  writeNote: (
    note: NotePropsV2,
    opts?: EngineWriteOptsV2
  ) => Promise<WriteNoteResp>;
  writeSchema: (schema: SchemaModulePropsV2) => Promise<void>;
};

// --- Engine

export type DEngineInitRespV2 = Required<RespV2<DEngineInitPayloadV2>>;
export type EngineDeleteNotePayload = NoteChangeEntry[];
// TODO: KLUDGE
export type DEngineDeleteSchemaPayloadV2 = DEngineInitPayloadV2;
export type DEngineDeleteSchemaRespV2 = DEngineInitRespV2;
export type EngineInfoResp = {
  version: string;
};
// --- KLUDGE END

export type EngineDeleteNoteResp = Required<RespV2<EngineDeleteNotePayload>>;
export type EngineQueryNoteResp = Required<RespV2<DNodePropsV2[]>>;
export type NoteQueryResp = Required<RespV2<NotePropsV2[]>>;
export type SchemaQueryResp = Required<RespV2<SchemaModulePropsV2[]>>;
export type StoreDeleteNoteResp = EngineDeleteNotePayload;
export type RenameNotePayload = NoteChangeEntry[];

export type GetNotePayloadV2 = {
  note: NotePropsV2 | undefined;
  changed: NoteChangeEntry[];
};
export type QueryNotesOpts = {
  qs: string;
  vault?: DVault;
  createIfNew?: boolean;
};

export type DEngineInitSchemaRespV2 = Required<RespV2<SchemaModulePropsV2[]>>;

export type DEngineV2SyncOpts = {
  metaOnly?: boolean;
};

export type DEngineV2 = DCommonProps &
  DCommonMethods & {
    store: DStoreV2;

    init: () => Promise<DEngineInitRespV2>;
    deleteNote: (
      id: string,
      opts?: EngineDeleteOptsV2
    ) => Promise<EngineDeleteNoteResp>;
    deleteSchema: (
      id: string,
      opts?: EngineDeleteOptsV2
    ) => Promise<DEngineDeleteSchemaRespV2>;
    info: () => Promise<RespRequiredV2<EngineInfoResp>>;
    sync: (opts?: DEngineV2SyncOpts) => Promise<DEngineInitRespV2>;

    getNoteByPath: (opts: GetNoteOptsV2) => Promise<RespV2<GetNotePayloadV2>>;
    getSchema: (qs: string) => Promise<RespV2<SchemaModulePropsV2>>;
    querySchema: (qs: string) => Promise<SchemaQueryResp>;
    queryNotes: (opts: QueryNotesOpts) => Promise<NoteQueryResp>;
    queryNotesSync({ qs }: { qs: string; vault?: DVault }): NoteQueryResp;
    renameNote: (opts: RenameNoteOptsV2) => Promise<RespV2<RenameNotePayload>>;

    // config
    writeConfig: (opts: ConfigWriteOpts) => Promise<RespV2<void>>;
    getConfig: () => Promise<RespV2<ConfigGetPayload>>;
  };

export type DEngineClientV2 = Omit<DEngineV2, "store">;

export type DStoreV2 = DCommonProps &
  DCommonMethods & {
    init: () => Promise<DEngineInitRespV2>;
    deleteNote: (
      id: string,
      opts?: EngineDeleteOptsV2
    ) => Promise<StoreDeleteNoteResp>;
    deleteSchema: (
      id: string,
      opts?: EngineDeleteOptsV2
    ) => Promise<DEngineDeleteSchemaRespV2>;
    renameNote: (opts: RenameNoteOptsV2) => Promise<RenameNotePayload>;
  };

// TODO: not used yet
export type DEngineV4 = {
  // Properties
  notes: NotePropsDictV2;
  schemas: SchemaModuleDictV2;
  wsRoot: string;
  vaults: DVault[];
  initialized: boolean;
} & DEngineV4Methods;

export type DEngineV4Methods = {
  init: () => Promise<DEngineInitRespV2>;
  deleteNote: (
    id: string,
    opts?: EngineDeleteOptsV2
  ) => Promise<EngineDeleteNoteResp>;
  deleteSchema: (
    id: string,
    opts?: EngineDeleteOptsV2
  ) => Promise<DEngineDeleteSchemaRespV2>;
  sync: (opts?: DEngineV2SyncOpts) => Promise<DEngineInitRespV2>;

  getNoteByPath: (opts: GetNoteOptsV2) => Promise<RespV2<GetNotePayloadV2>>;
  getSchema: (qs: string) => Promise<RespV2<SchemaModulePropsV2>>;
  querySchema: (qs: string) => Promise<SchemaQueryResp>;
  queryNotes: (opts: QueryNotesOpts) => Promise<NoteQueryResp>;
  queryNotesSync({ qs }: { qs: string }): NoteQueryResp;
  renameNote: (opts: RenameNoteOptsV2) => Promise<RespV2<RenameNotePayload>>;

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
  type: "string" | "number" | "boolean";
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
