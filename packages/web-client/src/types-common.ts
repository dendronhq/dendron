export interface Node<TData> {
  /**
   * Local ID
   */
  id: string;
  /**
   * Absolute unique id
   */
  logicalId: string;
  data: TData;
  parent: NodeStub<TData> | null;
  children: NodeStub<TData>[];
}

type NodeStub<TData> = Omit<Node<TData>, "parent" | "children" | "body">;

interface NodeData {
  title: string;
  desc: string;
}
export interface SchemaData extends NodeData {
  kind: SchemaNodeKind;
  // match: SchemaNodeMatchRule[];
  choices?: SchemaNodeStub[];
  // links: SchemaNodeLink[];
  /**
   * If namespace exists, display it here
   */
  namespace?: string;
}

export type SchemaNodeKind = "namespace";
export type SchemaNodeStub = NodeStub<SchemaData>;
