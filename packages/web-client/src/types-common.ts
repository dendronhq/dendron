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
  aliases?: string[];
  kind?: SchemaNodeKind;
  // match: SchemaNodeMatchRule[];
  choices?: { [key: string]: SchemaNodeStub };
  // links: SchemaNodeLink[];
  /**
   * If namespace exists, display it here
   */
  //namespace?: string;
}

export type SchemaNodeKind = "namespace";
export type SchemaNodeStub = NodeStub<SchemaData>;

export type SchemaYAML = {
  name: string;
  schema: { [key: string]: SchemaYAMLEntry };
};
type SchemaYAMLEntry = SchemaData | { children: { [key: string]: any } };

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
