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

type NodeStub<TData> = Omit<Node<TData>, "parent" | "children">;
export type NodeDict<TData> = { [logicalId: string]: Node<TData> };

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
export type NoteNode = Node<NoteData>;
export type NoteNodeStub = NodeStub<NoteData>;
export type NoteNodeDict = { [key: string]: NoteNode };
export type NoteStubDict = { [key: string]: NoteNodeStub };

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
export type SchemaNodeDict = { [key: string]: SchemaNode };
export type SchemaNodeKind = "namespace";
export type SchemaNodeStub = NodeStub<SchemaData>;
export type SchemaNode = Node<SchemaData>;

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
