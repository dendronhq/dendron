// Global Types

export type Stage = "dev" | "prod";

// === Node Types
export interface IDNode {
  id: string;
  title: string;
  desc: string;
  type: DNodeType;
  updated: string;
  created: string;
  parent: IDNode | null;
  children: IDNode[];
  body?: string;
  url: string;
  path: string;

  addChild(node: IDNode): void;
  renderBody(): string;
  toDocument(): any;
}
export interface DNodeProps {
  id?: string;
  title: string;
  desc: string;
  type: DNodeType;
  updated?: string;
  created?: string;
  parent: IDNode | null;
  children: IDNode[];
  body?: string;
}
export type DNodeDict = { [id: string]: IDNode };
export interface DNodeRaw<T extends INoteData | SchemaData> {
  id: string;
  title: string;
  desc: string;
  type: string;
  updated: string;
  created: string;
  parent: string | null;
  children: string[];
  data: T;
  body?: string;
}
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

export type NodeGetResp = {
  item: IDNode;
};

export type NodeGetBatchResp = {
  item: DNodeDict;
};

export type NodeGetRootResp = {
  item: IDNode;
};

export interface NodeQueryResp {
  item: IDNode[];
  error: Error | null;
}
export interface Scope {
  username: string;
}

export interface DEngine {
  /**
   * Get node based on id
   * get(id: ...)
   */
  get: (scope: Scope, id: string) => Promise<NodeGetResp>;

  getBatch: (scope: Scope, ids: string[]) => Promise<NodeGetBatchResp>;

  /**
   * Get node based on query
   * query(scope: {username: lukesernau}, queryString: "project", nodeType: note)
   * - []
   * - [Node(id: ..., title: project, children: [])]
   *
   */
  query: (scope: Scope, queryString: string) => Promise<NodeQueryResp>;

  /**
   * Write node to db
   */
  write: (scope: Scope, node: IDNode) => Promise<void>;

  /**
   * Write list of nodes
   */
  writeBatch: (scope: Scope, nodes: DNodeDict) => Promise<void>;
}
