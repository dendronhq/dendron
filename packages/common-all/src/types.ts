// Global Types

export type Stage = "dev" | "prod" | "test";

// === Node Types

// --- Primitives
export type NoteData = {
  schemaId?: string;
};
export type SchemaData = {
  namespace?: boolean;
};
export type DNodeData = SchemaData | NoteData;
export type IDNodeType = "note" | "schema";

// --- Node Raw
export type DNodeRawOpts<T extends DNodeData> = {
  id?: string;
  title?: string;
  desc?: string;
  updated?: string;
  created?: string;
  fname: string;
  parent?: string | null | "not_set";
  children?: string[];
  body?: string;
  data?: T;
};

export type DNodeRawProps<T> = Required<DNodeRawOpts<T>>;

// --- Node Full

export type IDNodeOpts<T> = Omit<DNodeRawOpts<T>, "parent" | "children"> & {
  type: IDNodeType;
  parent?: IDNode<T> | null;
  children?: IDNode<T>[];
};

export type IDNodeProps<T> = Required<IDNodeOpts<T>>;

export type IDNode<T> = IDNodeProps<T> & {
  // generated
  path: string;
  queryPath: string;
  // generated
  url: string;

  equal(node: IDNode<T>): boolean;
  addChild(node: IDNode<T>): void;
  renderBody(): string;
  toDocument(): any;
  toRawProps(): DNodeRawProps<T>;
};

// Other
export type DNodeDict<T> = { [id: string]: IDNode<T> };
export type DNodeRawDict<T> = { [id: string]: DNodeRawProps<T> };

// --- Notes
export type INoteOpts = Omit<IDNodeOpts<NoteData>, "type">;
export type INoteProps = Required<INoteOpts>;
export type INote = INoteProps;

// Schema
export type ISchemaOpts = Omit<IDNodeOpts<SchemaData>, "type">;
export type ISchemaProps = Required<ISchemaOpts>;
export type ISchema = ISchemaProps;

// TODO: EXPERIMENTAL
// --- Schema
// export type Schema = IDNode & SchemaData;
// export type SchemaData = {
//   pattern: string;
// };

/**
 * YAML reprsentation of a Schema
 * Used in Kevin's schema notation
 */
// export type SchemaYAMLRaw = {
//   name: string;
//   schema: { [key: string]: SchemaYAMLEntryRaw } | { root: SchemaYAMLEntryRaw };
// };
// export type SchemaYAMLEntryRaw = SchemaData & {
//   children: { [key: string]: any };
// };

// === Engine Types
export interface Resp<T> {
  data: T;
  error?: Error | null;
}

export type EngineGetResp<T> = Resp<IDNode<T>>;
export type EngineQueryResp<T> = Resp<IDNode<T>[]>;
export type StoreGetResp<T> = Resp<DNodeRawProps<T>>;
export type StoreQueryResp<T> = Resp<DNodeRawProps<T>[]>;

export interface Scope {
  username: string;
}

export interface NodeWriteOpts {
  newNode?: boolean;
}

export interface QueryOpts {
  fullNode?: boolean;
  queryOne?: boolean;
  createIfNew?: boolean;
  // hints
  webClient?: boolean;
  initialQuery?: boolean;
}
export interface DEngineStore {
  // fetchInitial: () => DNodeDict;
  delete: (id: string) => Promise<void>;
  get: <T>(
    scope: Scope,
    id: string,
    opts?: QueryOpts
  ) => Promise<StoreGetResp<T>>;
  query: <T>(
    scope: Scope,
    queryString: string,
    opts?: QueryOpts
  ) => Promise<EngineQueryResp<T>>;
  write: <T>(scope: Scope, node: IDNode<T>) => Promise<void>;
}

/**
 * Query: path based
 * Get: id based
 */
export interface DEngine {
  nodes: DNodeDict<DNodeData>;

  delete: (id: string) => Promise<void>;
  /**
   * Get node based on id
   * get(id: ...)
   */
  get: (
    scope: Scope,
    id: string,
    opts?: QueryOpts
  ) => Promise<EngineGetResp<DNodeData>>;

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
  ) => Promise<EngineQueryResp<DNodeData>>;

  write: (
    scope: Scope,
    node: IDNode<DNodeData>,
    opts?: NodeWriteOpts
  ) => Promise<void>;
  // /**
  //  * Write node to db
  //  */
  // write: (scope: Scope, node: IDNode) => Promise<void>;

  // /**
  //  * Write list of nodes
  //  */
  // writeBatch: (scope: Scope, nodes: DNodeDict) => Promise<void>;
}
