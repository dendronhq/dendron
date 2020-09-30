// Global Types

import { Note, Schema } from "./node";
import { URI } from "vscode-uri";
import { Position } from "unist";

export type Stage = "dev" | "prod" | "test";

// === Node Types

// --- Primitives

export enum LinkType {
  WIKI_LINK = "WIKI_LINK",
  IMAGE_LINK = "IMAGE_LINK",
}

export interface Link {
  type: LinkType;
  url: string;
  position: Position;
  label?: string;
}

export interface WikiLink extends Link {
  type: LinkType.WIKI_LINK;
}

export interface ImageLink extends Link {
  type: LinkType.IMAGE_LINK;
  alt?: string;
}

export type ProtoLink = WikiLink | ImageLink;

// TODO: depreacte
export type NoteLink = {
  type: "note";
  id: string;
};

export type NoteData = {
  schemaId?: string;
  links?: NoteLink[];
};
export type SchemaTemplate = {
  id: string;
  type: "snippet" | "note";
};
export type SchemaData = {
  namespace?: boolean;
  pattern?: string;
  template?: SchemaTemplate;
};
export type DNodeData = SchemaData | NoteData;
export type IDNodeType = "note" | "schema";

export type QueryMode = IDNodeType;
export type RawPropsOpts = {
  ignoreNullParent?: boolean;
};

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
  custom?: any;
};
export type DNodeRawProps<T extends DNodeData = DNodeData> = Required<
  DNodeRawOpts<T>
>;

export type NoteProps = {
  body: string;
  meta: any;
};

/**
 * Instead of full nodes, give pointers for parent and children
 */
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
  uri: URI;
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
  label: string;
  detail: string;
  bar?: string;

  equal(node: IDNode<T>): boolean;
  // match(identifier: string): boolean;
  addChild(node: IDNode<T>): void;
  /**
   * plain text based representation of node
   */
  render(): string;
  /**
   * Render body for rich-markdown-editor
   */
  renderBody(): string;
  toDocument(): any;
  toNoteProps(): NoteProps;

  toRawProps(hideBody?: boolean, opts?: RawPropsOpts): DNodeRawProps<T>;
  toRawPropsRecursive(opts?: RawPropsOpts): DNodeRawProps<T>[];
  validate(): boolean;
};
export type DNodeRawDict<T = DNodeData> = { [id: string]: DNodeRawProps<T> };
export type DNodeDict<T = DNodeData> = { [id: string]: IDNode<T> };

// --- Notes
export type NoteRawProps = DNodeRawProps<NoteData>;
export type INoteOpts = Omit<IDNodeOpts<NoteData>, "type"> & {
  schemaStub?: boolean;
};
export type INoteProps = Required<INoteOpts>;
export type INote = INoteProps & { domain: INote };
export type NoteDict = { [id: string]: Note };

// --- Schema
// V1 {
export type SchemaRawV1 = {
  version: string;
  imports?: SchemaRawImport;
  schemas: SchemaRawOpts[];
};
export type SchemaRawImport = string[];
export type SchemaRawEntry = SchemaRawOptsFlat | SchemaRawImport;
// } END V1

export type SchemaRawOptsFlat = Omit<DNodeRawOpts<any>, "data"> &
  SchemaData & { id: string; fname: string };
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

export type NodeWriteOpts = {
  /**
   * See QueryOpts.stub
   */
  stub?: boolean;
  /**
   * Write all children?
   * default: false
   */
  recursive?: boolean;
  /**
   * Write stubs
   * default: false
   */
  writeStub?: boolean;
} & Partial<UpdateNodesOpts>;

export type EngineDeleteOpts = {
  /**
   * Only delete from meta
   */
  metaOnly?: boolean;
};

export interface QueryOpts {
  /**
   * Should add to full nodes
   */
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

export type QueryOneOpts = Omit<QueryOpts, "queryOne">;

export type UpdateNodesOpts = {
  /**
   * If parents don't exist, create them
   */
  parentsAsStubs: boolean;
  /**
   * New Node, should add to `fullNode` cache
   */
  newNode: boolean;
  /**
   * Should skip adding parents, default: false
   */
  noAddParent?: boolean;
};

export type StoreQueryOpts = QueryOpts & {
  schemas?: SchemaDict;
};
export type StoreDeleteOpts = {
  fpath?: string;
};

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
  /**
   * See DEngineStoreWriteOpts.writeStub
   */
  writeStub?: boolean;
};

export type Checkpoint = string | null;
export type DEngineStoreOpts = {
  cache?: DEngineCache;
};

export type DEngineCache = {
  get(key: string): Promise<DNodeRawProps | null>;
  //set(key: string, value: DNodeRawProps): Promise<void>;
  getAll(type: IDNodeType, checkpoint: any): Promise<DNodeRawProps[]>;
  setAll(
    type: IDNodeType,
    entries: DNodeRawProps[],
    checkpoint: any
  ): Promise<void>;
};

export interface DEngineStore<T = DNodeData, O extends DEngineStoreOpts = any> {
  opts: O;
  // fetchInitial: () => DNodeDict;
  delete: (id: string, opts?: StoreDeleteOpts) => Promise<void>;
  get: (id: string, opts?: QueryOpts) => Promise<StoreGetResp<T>>;
  query: (
    queryString: string,
    mode: QueryMode,
    opts?: StoreQueryOpts
  ) => Promise<EngineQueryResp<T>>;
  write: <T>(node: IDNode<T>, opts?: DEngineStoreWriteOpts) => Promise<void>;
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

export type DEngineQuery = {
  queryString: string;
  mode: QueryMode;
  opts?: QueryOpts;
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

  delete: (
    id: string,
    mode: QueryMode,
    opts?: EngineDeleteOpts
  ) => Promise<void>;

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
  queryOne: (
    queryString: string,
    mode: QueryMode,
    opts?: QueryOneOpts
  ) => Promise<EngineGetResp<DNodeData>>;

  write: (node: IDNode<DNodeData>, opts?: NodeWriteOpts) => Promise<void>;

  /**
   * Update engine properties
   * @param opts
   */
  updateProps(opts: Partial<DEngineOpts>): void;

  /**
   * Update node metadata
   * @param node
   */
  updateNodes(nodes: IDNode[], opts: UpdateNodesOpts): Promise<void>;

  // /**
  //  * Write list of nodes
  //  */
  // writeBatch: (scope: Scope, nodes: DNodeDict) => Promise<void>;
}

export type DendronConfig = {
  site: DendronSiteConfig;
};

export type HierarchyConfig = {
  publishByDefault: boolean;
  noindexByDefault: boolean;
};

export type LegacyDendronSiteConfig = {
  // TODO: rename `siteHomePage`
  // DEPRECATED
  noteRoot?: string;

  // TODO: rename `siteHierarchies`
  // DEPRECATED
  noteRoots?: string[];

  /**
   * // TODO: rename `siteRootDir`
   * Where is site going to be published
   */
  // DEPRECATED
  siteRoot?: string;
};

export type DendronSiteConfig = {
  /**
   * If set, instead of copying assets, load assets from the assigned prefix
   */
  assetsPrefix?: string;

  /**
   * By default, the domain of your siteHiearchies page
   */
  siteIndex?: string;
  /**
   * Hiearchies to publish
   */
  siteHierarchies: string[];

  /**
   * Where your site will be published.
   * Relative to Dendron workspace
   */
  siteRootDir: string;

  /**
   * Folder where your notes will be kept. By default, "notes"
   */
  siteNotesDir?: string;

  usePrettyRefs?: boolean;

  /**
   * Control publication on a per hierarchy basis
   */
  config?: { [key: string]: HierarchyConfig };
};

// === V2

export type DNodePointerV2 = string;

export type DNodePropsV2<T = any> = {
  id: string;
  fname: string;
  stub?: boolean;
  children: DNodePointerV2[];
  data: T;
};
export type SchemaPropsV2 = DNodePropsV2<SchemaData>;
export type NotePropsV2 = DNodePropsV2<NoteDict>;

export type DNodePropsDictV2 = {
  [key: string]: DNodePropsV2;
};

export type NotePropsDictV2 = {
  [key: string]: DNodePropsV2;
};

export type SchemaPropsDictV2 = {
  [key: string]: DNodePropsV2;
};

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
   * Use with `createIfNew`
   * If true, create a stub node.
   * A stub node is not written to disk
   */
  stub?: boolean;
  /**
   * If node does not exist, create it?
   */
  createIfNew?: boolean;
}

export type DEngineV2 = {
  notes: NotePropsDictV2;
  schemas: SchemaPropsDictV2;

  init: () => Promise<void>;
  updateNodes(nodes: DNodePropsV2[], opts: UpdateNodesOpts): Promise<void>;

  delete: (
    id: string,
    mode: QueryMode,
    opts?: EngineDeleteOpts
  ) => Promise<void>;

  query: (
    queryString: string,
    mode: QueryMode,
    opts?: QueryOptsV2
  ) => Promise<Resp<DNodePropsV2[]>>;
};
