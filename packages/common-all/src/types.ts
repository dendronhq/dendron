// Global Types

export type Stage = "dev" | "prod";

// === Node Types
type OptionalDnodeMetaProps =
  | "id"
  | "updated"
  | "created"
  | "parentId"
  | "childrenIds";

export interface IDNodeMeta {
  id: string;
  title: string;
  desc: string;
  updated: string;
  created: string;
  parentId: string | null;
  childrenIds: string[];
}
export type IDNodeMetaProps = Omit<IDNodeMeta, OptionalDnodeMetaProps> &
  Pick<Partial<IDNodeMeta>, OptionalDnodeMetaProps>;

export interface IDNode extends IDNodeMeta {
  type: DNodeType;
  parent: IDNode | null;
  children: IDNode[];
  body?: string;
  path: string;
  // generated
  url: string;

  addChild(node: IDNode): void;
  renderBody(): string;
  toDocument(): any;
}
export interface DNodeProps extends IDNodeMetaProps {
  type: DNodeType;
  parent: IDNode | null;
  children: IDNode[];
  body?: string;
}
export type DNodeDict = { [id: string]: IDNode };

// DEPRECATE: not used
// export interface DNodeRaw<T extends INoteData | SchemaData> {
//   id: string;
//   title: string;
//   desc: string;
//   type: string;
//   updated: string;
//   created: string;
//   parent: string | null;
//   children: string[];
//   data: T;
//   body?: string;
// }

export type DNodeType = "note" | "schema";

export type INote = IDNode & INoteData;
export type INoteProps = Omit<DNodeProps, "parent" | "children"> &
  Partial<INoteData>;

export type INoteData = {
  schemaId: string;
};

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

export type NodeGetResp = Resp<IDNode>;

export type NodeQueryResp = Resp<IDNode[]>;

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
  get: (scope: Scope, id: string, opts?: QueryOpts) => Promise<NodeGetResp>;
  query: (
    scope: Scope,
    queryString: string,
    opts?: QueryOpts
  ) => Promise<NodeQueryResp>;
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
  get: (scope: Scope, id: string, opts?: QueryOpts) => Promise<NodeGetResp>;

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
  ) => Promise<NodeQueryResp>;

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
