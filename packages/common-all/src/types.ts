// Global Types

export type Stage = "dev" | "prod";

// === Node Types

// --- Node Raw
export type DNodeRawOpts = {
  id?: string;
  title: string;
  desc: string;
  updated?: string;
  created?: string;
  parentId?: string | null;
  childrenIds?: string[];
  body?: string;
};

export type DNodeRawProps = Required<DNodeRawOpts>;

// --- Node Full
export type IDNodeType = "note" | "schema";

// TODO: remove parentId and children Ids ?
export type IDNodeOpts = {
  type: IDNodeType;
  parent?: IDNode | null;
  children?: IDNode[];
} & DNodeRawOpts;
export type IDNodeProps = Required<IDNodeOpts>;
//type IDNodePropsKeysPartial = "parent" | "children";
// export type IDNodeOpts = DNodeRawOpts &
//   Omit<_IDNodeProps, IDNodePropsKeysPartial>;

export type IDNode = IDNodeProps & {
  // generated
  path: string;
  // generated
  url: string;

  addChild(node: IDNode): void;
  renderBody(): string;
  toDocument(): any;
};

// Other
export type DNodeDict = { [id: string]: IDNode };

// --- Notes
export type INoteOpts = IDNodeOpts & {
  schemaId?: string;
};
export type INoteProps = Required<INoteOpts>;
export type INote = INoteProps;

// TODO: EXPERIMENTAL
// --- Schema
export type Schema = IDNode & SchemaData;
export type SchemaData = {
  pattern: string;
};

/**
 * YAML reprsentation of a Schema
 * Used in Kevin's schema notation
 */
export type SchemaYAMLRaw = {
  name: string;
  schema: { [key: string]: SchemaYAMLEntryRaw } | { root: SchemaYAMLEntryRaw };
};
export type SchemaYAMLEntryRaw = SchemaData & {
  children: { [key: string]: any };
};

// === Engine Types
export interface Resp<T> {
  data: T;
  error?: Error | null;
}

export type EngineGetResp = Resp<IDNode>;
export type EngineQueryResp = Resp<IDNode[]>;
export type StoreGetResp = Resp<DNodeRawProps>;
export type StoreQueryResp = Resp<DNodeRawProps[]>;

export interface Scope {
  username: string;
}

export interface QueryOpts {
  fullNode?: boolean;
  webClient?: boolean;
  queryOne?: boolean;
}
export interface DEngineStore {
  // fetchInitial: () => DNodeDict;
  get: (scope: Scope, id: string, opts?: QueryOpts) => Promise<StoreGetResp>;
  query: (
    scope: Scope,
    queryString: string,
    opts?: QueryOpts
  ) => Promise<StoreQueryResp>;
  write: (scope: Scope, node: IDNode) => Promise<void>;
}

/**
 * Query: path based
 * Get: id based
 */
export interface DEngine {
  nodes: DNodeDict;
  /**
   * Get node based on id
   * get(id: ...)
   */
  get: (scope: Scope, id: string, opts?: QueryOpts) => Promise<EngineGetResp>;

  // getBatch: (scope: Scope, ids: string[]) => Promise<NodeGetBatchResp>;

  /**
   * Get node based on query
   * query(scope: {username: lukesernau}, queryString: "project", nodeType: note)
   * - []
   * - [Node(id: ..., title: project, children: [])]
   */
  query: (
    scope: Scope,
    queryString: string,
    opts?: QueryOpts
  ) => Promise<EngineQueryResp>;

  write: (scope: Scope, node: IDNode) => Promise<void>;
  // /**
  //  * Write node to db
  //  */
  // write: (scope: Scope, node: IDNode) => Promise<void>;

  // /**
  //  * Write list of nodes
  //  */
  // writeBatch: (scope: Scope, nodes: DNodeDict) => Promise<void>;
}
