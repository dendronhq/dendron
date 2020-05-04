export interface Node {
  /**
   * Local ID
   */
  id: string;
  data: NodeData;
  // currently string, in the future, this might be a tree of nodes
  body?: string;
  parent: NodeStub | null;
  children: NodeStub[];
}

/**
 */

export type NodeStub = Omit<Node, "parent" | "children">;
export type NodeStubDict = { [id: string]: NodeStub };
export type NodeDict = { [id: string]: Node };
export function toStub(node: Node | NodeStub): NodeStub { return { id: node.id, body: node.body, data: node.data } }

interface NodeData {
  schemaId: string;
  title: string;
  desc: string;
  type: DataType;
}
export interface SchemaData extends NodeData {
  aliases?: string[];
  kind?: SchemaNodeKind;
  // match: SchemaNodeMatchRule[];
  choices?: { [key: string]: NodeStub };
  // links: SchemaNodeLink[];
  /**
   * If namespace exists, display it here
   */
  //namespace?: string;
  //   language:
  //     kind: namespace
  //     choices:
  //         python:
  //         ruby:
  //         ts:
  //     children:
  //         data
  //         flow
}

export interface NoteData extends NodeData {}

export type SchemaDataKey = keyof SchemaData;

export type RequiredSchemaDataKey = "title" | "desc";
export const RequiredSchemaDataKeyValues: RequiredSchemaDataKey[] = [
  "title",
  "desc",
];

export type OptionalSchemaDataKey = Exclude<
  keyof SchemaData,
  RequiredSchemaDataKey
>;
export type SchemaNodeKind = "namespace";

export type SchemaYAMLRaw = {
  name: string;
  schema: { [key: string]: SchemaYAMLEntryRaw } | { root: SchemaYAMLEntryRaw };
};
export type SchemaYAMLEntryRaw = SchemaData & {
  children: { [key: string]: any };
};

/*
global:
  schema:
    output:
      aliases: [out]
      desc: anything I want to put out. formerly known as report
    usecase:
      alias: use
      desc: describes a way something is used
    gotcha:
      desc: something novel
    journal:
      desc: continuously updated
      kind: namespace
      choices:
        meet: 
        design:
        changelog:
    internal:
      desc: internal impletation
    templates:
      alias: temp
      desc: re-usable templates
    notes:
      desc: notes on something
    todo:
      desc: "things to update"
      children:
        tasks:
        questions:
    questions:
      desc: "questions i have"
    ref:
      desc: catchall
*/

export type NodeType = "stub" | "full";
export type DataType = "schema" | "note";

export type NodeGetResp = {
  item: Node | NodeStub;
  nodeType: NodeType;
};

export type NodeGetBatchResp = {
  item: NodeDict | NodeStubDict;
  nodeType: NodeType;
};

export type NodeGetRootResp = {
  item: Node;
};

export interface NodeQueryResp {
  item: NodeDict | NodeStubDict;
  nodeType: NodeType;
  error: Error | null;
}
export interface Scope {
  username: string;
}

export interface DendronEngine {
  /**
   * Get node based on id
   * get(id: ...)
   */
  get: (
    scope: Scope,
    id: string,
    nodeType: NodeType,
  ) => Promise<NodeGetResp>;

  getBatch: (
    scope: Scope,
    ids: string[],
    nodeType: NodeType,
  ) => Promise<NodeGetBatchResp>;
  // load alphacortex
  /**
   * NodeStorageAPI.getRoot()
   * {
   *   parent: null
   *   children:
   *     - Alphacortex
   * }
   *
   * welcome page
   * sider
   */
  // getRoot: (scope: Scope, dataType: DataType) => Promise<NodeGetRootResp>;

  /**
   * Get node based on query
   * query(scope: {username: lukesernau}, queryString: "Project", nodeType: stub, dataType: note})
   * - []
   * - [Node(id: ..., title: project, children: [])]
   *
   */
  query: (
    scope: Scope,
    queryString: string,
    nodeType: NodeType,
  ) => Promise<NodeQueryResp>;

  /**
   * Write node to db
   */
  write: (scope: Scope, node: Node) => Promise<void>;

  /**
   * Write list of nodes
   */
  writeBatch: (
    scope: Scope,
    nodes: NodeDict,
  ) => Promise<void>;
}

// convert to dictionary, in return
