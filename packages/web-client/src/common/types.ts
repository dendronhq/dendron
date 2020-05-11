// === Node Types
export interface DNode {
  id: string;
  title: string;
  desc: string;
  type: DNodeType;
  updated: string;
  created: string;
  parent: DNode | null;
  children: DNode[];
  body?: string;
}
export type DNodeDict = { [id: string]: DNode };
export interface DNodeRaw<T extends NoteData | SchemaData> {
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

export type Note = DNode & NoteData;
export type NoteData = {
  schemaId: string;
};

export type Schema = DNode & SchemaData;
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
  item: DNode;
};

export type NodeGetBatchResp = {
  item: DNodeDict;
};

export type NodeGetRootResp = {
  item: DNode;
};

export interface NodeQueryResp {
  item: DNodeDict;
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
  write: (scope: Scope, node: DNode) => Promise<void>;

  /**
   * Write list of nodes
   */
  writeBatch: (scope: Scope, nodes: DNodeDict) => Promise<void>;
}
