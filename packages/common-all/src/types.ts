// Global Types

import { Note, Schema } from "./node";

export type Stage = "dev" | "prod" | "test";

// === Node Types

// --- Primitives
export type NoteData = {
  schemaId?: string;
};
export type SchemaData = {
  namespace?: boolean;
  pattern?: string;
};
export type DNodeData = SchemaData | NoteData;
export type IDNodeType = "note" | "schema";

export type QueryMode = IDNodeType;

// --- Nodes
export type DNodeRawOpts<T extends DNodeData> = {
  id?: string;
  title?: string;
  desc?: string;
  stub?: boolean;
  updated?: string;
  created?: string;
  /**
   * Same as uri
   */
  fname: string;
  parent?: string | null | "root";
  children?: string[];
  body?: string;
  data?: T;
  /**
   * Custom attributes
   */
  custom?: any
};
export type DNodeRawProps<T extends DNodeData = DNodeData> = Required<
  DNodeRawOpts<T>
>;

export type IDNodeOpts<T = DNodeData> = Omit<
  DNodeRawOpts<T>,
  "parent" | "children"
> & {
  type: IDNodeType;
  parent?: IDNode<T> | null;
  children?: IDNode<T>[];
};
export type IDNodeProps<T = DNodeData> = Required<IDNodeOpts<T>>;

export type IDNode<T = DNodeData> = IDNodeProps<T> & {
  // generated
  nodes: IDNode<T>[];
  /**
   * The raw path
   */
  path: string;
  basename: string;
  /**
   * Path dependent on type of node
   *   - for notes, this is same as `path` except for `root` node, in which case this is ""
   *   - for schemas, this is minimatch pattern of schema ids
   */
  logicalPath: string;
  /**
   * Child of the root (this.parent == root)
   */
  domain: IDNode<T>;
  // absolute url to node id
  // FIXM:E not used
  url: string;
  label: string;
  detail: string;

  equal(node: IDNode<T>): boolean;
  // match(identifier: string): boolean;
  addChild(node: IDNode<T>): void;
  /**
   * Render body for rich-markdown-editor
   */
  renderBody(): string;
  toDocument(): any;
  toRawProps(): DNodeRawProps<T>;
  toRawPropsRecursive(): DNodeRawProps<T>[];
  validate(): boolean;
};
export type DNodeRawDict<T = DNodeData> = { [id: string]: DNodeRawProps<T> };
export type DNodeDict<T = DNodeData> = { [id: string]: IDNode<T> };

// --- Notes
export type NoteRawProps = DNodeRawProps<NoteData>;
export type INoteOpts = Omit<IDNodeOpts<NoteData>, "type"> & { schemaStub?: boolean };
export type INoteProps = Required<INoteOpts>;
export type INote = INoteProps & { domain: INote };
export type NoteDict = { [id: string]: Note };

// --- Schema
export type SchemaRawOpts = DNodeRawOpts<SchemaData> &
  Required<Pick<DNodeRawOpts<SchemaData>, "id" | "fname">>;
export type SchemaRawProps = DNodeRawProps<SchemaData>;
export type ISchemaOpts = Omit<IDNodeOpts<SchemaData>, "type">;
export type ISchemaProps = Required<ISchemaOpts>;
export type ISchema = ISchemaProps;
export type SchemaDict = { [id: string]: Schema };

// === Engine Types
export interface Resp<T> {
  data: T;
  error?: Error | null;
}

export type EngineGetResp<T = DNodeData> = Resp<IDNode<T>>;
export type EngineQueryResp<T = DNodeData> = Resp<IDNode<T>[]>;
export type StoreGetResp<T = DNodeData> = Resp<DNodeRawProps<T>>;
export type StoreQueryResp<T = DNodeData> = Resp<DNodeRawProps<T>[]>;

export interface NodeWriteOpts {
  /**
   * If newNode, will add it to the parent
   */
  newNode?: boolean;
  /**
   * See QueryOpts.stub
   */
  stub?: boolean;
  /**
   * If parents don't exist, create stubs
   * default: false
   */
  parentsAsStubs?: boolean;
  /**
   * Write all children?
   * default: false
   */
  recursive?: boolean;
}

export type EngineDeleteOpts = {
  /**
   * Only delete from meta
   */
  metaOnly?: boolean
}

export interface QueryOpts {
  fullNode?: boolean;
  /**
   * Just get one result
   */
  queryOne?: boolean;
  /**
   * Use with `createIfNew`
   * If true, create a stub node.
   * A stub node is not written to disk
   */
  stub?: boolean;
  /**
   * If node does not exist, create it?
   */
  createIfNew?: boolean;
  // --- hints
  // DEPPRECATE
  webClient?: boolean;
  initialQuery?: boolean;
  mode?: QueryMode;
}

export type QueryOneOpts = Omit<QueryOpts, "queryOne">

export type UpdateNodesOpts = {
  parentsAsStubs: boolean
  newNode: boolean
}

export type StoreQueryOpts = QueryOpts & {
  schemas?: SchemaDict
}

export interface DEngineParser<TOpts = any> {
  // parse: <T>(content: any, mode: QueryMode, opts: TOpts) => DNodeRawProps<T>[];
  parseSchema(data: any, opts: TOpts): SchemaRawProps[];
  parseNote(data: any, opts: TOpts): NoteRawProps[];
}

export type DEngineStoreWriteOpts = {
  /**
   * If set, don't write to file
   */
  stub?: boolean;
  /**
   * See DEngineStoreWriteOpts.recursive
   */
  recursive?: boolean;
};

export interface DEngineStore<T = DNodeData, O = any> {
  opts: O;
  // fetchInitial: () => DNodeDict;
  delete: (id: string) => Promise<void>;
  get: (id: string, opts?: QueryOpts) => Promise<StoreGetResp<T>>;
  query: (
    queryString: string,
    mode: QueryMode,
    opts?: StoreQueryOpts
  ) => Promise<EngineQueryResp<T>>;
  write: <T>(
    node: IDNode<T>,
    opts?: DEngineStoreWriteOpts
  ) => Promise<void>;
  updateNodes(nodes: IDNode[]): Promise<void>;
}

export type DEngineMode = "exact" | "fuzzy";

export type DEngineOpts = {
  /**
   * TODO: this is currently not supported
   */
  root: string;
  mode?: DEngineMode;
};

/**
 * Query: path based
 * Get: id based
 */
export interface DEngine {
  notes: NoteDict;
  schemas: SchemaDict;
  props: Required<DEngineOpts>;
  initialized: boolean;
  store: DEngineStore;

  /**
   * Load all nodes
   */
  init: () => Promise<void>;

  delete: (id: string, opts?: EngineDeleteOpts) => Promise<void>;

  /**
   * Get node based on id
   * get(id: ...)
   */
  get: (
    id: string,
    mode: QueryMode,
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
    queryString: string,
    mode: QueryMode,
    opts?: QueryOpts
  ) => Promise<EngineQueryResp<DNodeData>>;

  /**
   * Shortcut Function
   */
  queryOne: (queryString: string, mode: QueryMode, opts?: QueryOneOpts) => Promise<EngineGetResp<DNodeData>>

  write: (
    node: IDNode<DNodeData>,
    opts?: NodeWriteOpts
  ) => Promise<void>;

  /**
   * Update engine properties
   * @param opts 
   */
  updateProps(opts: Partial<DEngineOpts>): void


  /**
   * Update node metadata
   * @param node 
   */
  updateNodes(nodes: IDNode[], opts: UpdateNodesOpts): Promise<void>

  // /**
  //  * Write list of nodes
  //  */
  // writeBatch: (scope: Scope, nodes: DNodeDict) => Promise<void>;
}
