import {
  DNodeData,
  DNodeRawOpts,
  DNodeRawProps,
  IDNode,
  IDNodeOpts,
  IDNodeType,
  INote,
  INoteOpts,
  ISchema,
  ISchemaOpts,
  NoteData,
  NoteRawProps,
  SchemaData,
  SchemaRawOpts,
  SchemaRawProps
} from "./types";

import YAML from "yamljs";
/* eslint-disable no-loop-func */
// import { IconType } from "antd/lib/notification";
import _ from "lodash";
import { genUUID } from "./uuid";

// export interface DataNode {
//   checkable?: boolean;
//   children?: DataNode[];
//   disabled?: boolean;
//   disableCheckbox?: boolean;
//   icon?: IconType;
//   isLeaf?: boolean;
//   key: string | number;
//   title?: React.ReactNode;
//   selectable?: boolean;
//   switcherIcon?: IconType;
//   /** Set style of TreeNode. This is not recommend if you don't have any force requirement */
//   className?: string;
//   style?: React.CSSProperties;
// }

// @ts-ignore
interface YAMLEntryOpts {
  id: string;
}

export class DNodeUtils {
  static dirName(nodePath: string) {
    return nodePath
      .split(".")
      .slice(0, -1)
      .join(".");
  }

  static domainName(nodePath: string) {
    return nodePath.split("."[0]);
  }
}

export class DNodeRaw {
  static createProps<T>(opts: DNodeRawOpts<T>): DNodeRawProps<T> {
    const {
      id,
      desc,
      fname,
      updated,
      created,
      parent,
      stub,
      children,
      body,
      data
    } = _.defaults(opts, {
      updated: "TODO",
      created: "TODO",
      id: genUUID(),
      desc: "",
      children: [],
      stub: false,
      parent: "not_set",
      body: "",
      data: {},
      fname: "not_set"
    });
    const title = opts.title || fname;
    return {
      id,
      title,
      desc,
      fname,
      updated,
      created,
      parent,
      children,
      stub,
      body,
      data
    };
  }
}

/*
Create Schema based on Minimal Props
- id: b111db5b-bc52-4977-893b-307522f89ea3
  title: "foo",
  parent: null
  children:
    - one
*/
export class SchemaNodeRaw {
  static createProps(opts: SchemaRawOpts): SchemaRawProps {
    opts.title = opts.title || opts.id;
    return DNodeRaw.createProps<SchemaData>(opts);
  }
}

type QuickPickItem = {
  label: string;

  /**
   * A human-readable string which is rendered less prominent in the same line. Supports rendering of
   * [theme icons](#ThemeIcon) via the `$(<name>)`-syntax.
   */
  description?: string;

  /**
   * A human-readable string which is rendered less prominent in a separate line. Supports rendering of
   * [theme icons](#ThemeIcon) via the `$(<name>)`-syntax.
   */
  detail?: string;

  /**
   * Optional flag indicating if this item is picked initially.
   * (Only honored when the picker allows multiple selections.)
   *
   * @see [QuickPickOptions.canPickMany](#QuickPickOptions.canPickMany)
   */
  picked?: boolean;

  /**
   * Always show this item.
   */
  alwaysShow?: boolean;
};

export abstract class DNode<T = DNodeData> implements IDNode<T>, QuickPickItem {
  public id: string;
  public title: string;
  public desc: string;
  public fname: string;
  public type: IDNodeType;
  public updated: string;
  public created: string;
  public parent: IDNode<T> | null;
  public children: IDNode<T>[];
  public body: string;
  public data: T;
  public label: string;
  public stub: boolean;

  constructor(opts: IDNodeOpts<T>) {
    const {
      id,
      title,
      desc,
      fname,
      type,
      updated,
      created,
      stub,
      body,
      data,
      children
    } = _.defaults(
      opts,
      DNodeRaw.createProps(_.defaults(opts, { parent: null, children: [] }))
    );

    this.id = id;
    this.title = title || fname.split(".").slice(-1)[0];
    this.desc = desc;
    this.fname = fname;
    this.type = type;
    this.updated = updated;
    this.created = created;
    this.parent = opts.parent ? opts.parent : null;
    this.children = children;
    this.body = body;
    this.data = data;
    this.label = this.logicalPath;
    this.stub = stub;
  }

  get domain(): DNode<T> {
    if (this.parent?.title === "root" || _.isNull(this.parent)) {
      return this;
    }
    return this.parent.domain;
  }

  get basename(): string {
    return this.logicalPath.split(".").slice(-1)[0];
  }

  /**
   * Self and all children
   */
  get nodes(): DNode<T>[] {
    const out: DNode<T>[] = [this as DNode<T>].concat(
      this.children.map(c => c.nodes).flat()
    );
    return out;
  }

  /**
   * dot delimited path
   *    - for root node, its ""
   *    - for everything else, its the dot delimited name
   */
  get logicalPath(): string {
    if (this.fname === "root") {
      return "";
    } else {
      return this.fname;
    }
  }

  // used in lookup
  get queryPath(): string {
    return this.path;
  }

  // used in parsing
  get path(): string {
    return this.fname;
    // if (this.parent && this.parent.title !== "root") {
    //   return [this.parent.path, this.title].join(".");
    // } else {
    //   return this.title;
    // }
  }

  abstract get url(): string;

  addChild(node: IDNode<T>) {
    this.children.push(node);
    node.parent = this;
  }

  equal(node: IDNode<T>) {
    const props1 = this.toRawProps();
    const props2 = node.toRawProps();
    return _.every([
      _.isEqual(_.omit(props1, "body"), _.omit(props2, "body")),
      _.trim(props1.body) === _.trim(props2.body)
    ]);
  }

  // abstract match(identifier: any): boolean;

  renderBody(): string {
    return this.body;
  }

  toDocument() {
    return {
      document: {
        nodes: [
          {
            object: "block",
            type: "paragraph",
            nodes: [
              {
                object: "text",
                text: this.renderBody()
              }
            ]
          }
        ]
      }
    };
  }

  toRawProps(): DNodeRawProps<T> {
    const props = _.pick(this, [
      "id",
      "title",
      "desc",
      "type",
      "updated",
      "created",
      "body",
      "fname",
      "data",
      "stub"
    ]);
    let parent;
    if (this.parent?.title === "root") {
      parent = "root";
    } else {
      // TODO: this should never happen
      parent = this.parent?.id ?? "root";
    }
    const children = this.children.map(c => c.id);
    return { ...props, parent, children };
  }

  toRawPropsRecursive(): DNodeRawProps<T>[] {
    const parent: DNodeRawProps<T> = this.toRawProps();
    const children: DNodeRawProps<T>[] = this.children
      .map(
        (ch: DNode<T>) =>
          // @ts-ignore
          ch.toRawPropsRecursive()
        // eslint-disable-next-line function-paren-newline
      )
      .flat();
    // @ts-ignore
    const out = [parent].concat(children);
    return out.flat();
  }
  //othrow Error("to implement");
  //   return [];
  // }

  validate(): boolean {
    return true;
  }
}

export class Note extends DNode<NoteData> implements INote {
  public schemaId: string;

  static createStub(fname: string): Note {
    return new Note({ stub: true, fname });
  }

  constructor(props: INoteOpts) {
    super({
      type: "note",
      ..._.defaults(props, {
        parent: null,
        children: []
      })
    });
    this.schemaId = props?.data?.schemaId || "-1";
  }

  // vscode detail pane
  get detail(): string {
    const cleanPath = this.logicalPath
      .split(".")
      .slice(0, -1)
      .join(".");
    if (_.isEmpty(cleanPath)) {
      return this.logicalPath;
    } else {
      return cleanPath + ".";
    }
  }

  get description(): string {
    return "description";
  }

  get url(): string {
    return `/doc/${this.id}`;
  }
}

export class Schema extends DNode<SchemaData> implements ISchema {
  static createRoot() {
    const props = SchemaNodeRaw.createProps({ id: "root", fname: "root" });
    return new Schema({ ...props, parent: null, children: [] });
  }

  constructor(props: ISchemaOpts) {
    super({
      type: "schema",
      ..._.defaults(props, {
        parent: null,
        children: [],
        data: {}
      })
    });
  }

  get queryPath(): string {
    return this.id;
  }

  get namespace(): boolean {
    return this.data?.namespace || false;
  }

  get url(): string {
    return `/schema/${this.id}`;
  }

  renderBody() {
    const out = _.map(this.toRawPropsRecursive(), props => {
      return _.pick(props, [
        "id",
        "title",
        "desc",
        "children",
        "parent",
        "data",
        "fname"
      ]);
    });
    return ["```", YAML.stringify(out, undefined, 4), "```"].join("\n");
  }
}

const matchSchemaPropsToId = (
  id: string,
  props: SchemaRawProps[]
): SchemaRawProps => {
  const out = _.find(props, p => _.some([p.id === id]));
  if (_.isUndefined(out)) {
    throw Error(`no match found for ${id}, props: ${props}`);
  }
  return out;
};

// TODO:move to node
function getRoot(nodes: NoteRawProps[]) {
  // nodes: {nodes}
  const rootNode = _.find(
    nodes,
    ent => ent.title === "root" || _.isNull(ent.parent)
  );
  if (!rootNode) {
    throw Error("no root node found");
  }
  const node = new Note({ ...rootNode, parent: null, children: [] });
  return { node, childrenIds: rootNode.children };
}

export class NodeBuilder {
  getDomainsRoot<T extends DNodeData>(
    nodes: DNodeRawProps<T>[]
  ): DNodeRawProps<T>[] {
    // nodes: {nodes}
    const rootNodes = _.filter(nodes, ent => ent.parent === "root");
    if (_.isEmpty(rootNodes)) {
      throw Error("no root node found");
    }
    return rootNodes;
  }

  toNote(item: NoteRawProps, parents: Note[]) {
    const node = new Note({ ...item, parent: null, children: [] });
    const { parent: parentId, children } = item;
    const parent: Note = _.find(parents, { id: parentId }) as Note;
    parent.addChild(node);
    return { node, parent, children };
  }

  toSchema(item: SchemaRawProps, parent: Schema, props: SchemaRawProps[]) {
    // DEBUG: item: {item}, parents: {parents}
    const node = new Schema({ ...item, parent, children: [] });
    item.children.forEach(chId => {
      const match = matchSchemaPropsToId(chId, props);
      return this.toSchema(match, node, props);
    });
    parent.addChild(node);
    return node;
  }

  buildNoteFromProps(props: NoteRawProps[]): Note[] {
    const { node: rootNode, childrenIds } = getRoot(props);
    const out = [];
    // const { node: rootNode, children: rootChildrenIds } = this.toNote(
    //   rootRaw,
    //   []
    // );
    out.push([rootNode]);

    let parentNodes = [rootNode];
    let nodeIds = childrenIds;

    while (!_.isEmpty(nodeIds)) {
      const currentNodes: Note[] = [];

      nodeIds = nodeIds
        .map((id: string) => {
          const nodeProps = props.find(ent => ent.id === id) as NoteRawProps;
          const { node, children } = this.toNote(nodeProps, parentNodes);
          currentNodes.push(node);
          return children;
        })
        .flat();
      out.push(currentNodes);
      parentNodes = currentNodes;
    }
    return out.flat();
  }

  buildSchemaFromProps(props: SchemaRawProps[]) {
    const root = Schema.createRoot();
    const rootDomains: SchemaRawProps[] = this.getDomainsRoot<SchemaData>(
      props
    );
    let out = [root];
    rootDomains.forEach(rootRaw => {
      const domain = this.toSchema(rootRaw, root, props);
      out = out.concat(domain.nodes as Schema[]);
    });
    // DEBUG ctx: "parseSchema", out:
    return out;
  }
}

export class NoteUtils {
  static createStubNotes(from: Note, to: Note) {
    // ""
    const fromPath = from.logicalPath;
    // ""
    const toPath = to.logicalPath;
    const diffPath = _.difference(toPath.split("."), fromPath.split("."));
    let stubPath = fromPath;
    let parent = from;
    diffPath.slice(0, -1).forEach(part => {
      if (_.isEmpty(stubPath)) {
        stubPath = part;
      } else {
        stubPath += `.${part}`;
      }
      const n = Note.createStub(stubPath);
      parent.addChild(n);
      parent = n;
    });
    parent.addChild(to);
    return to;
  }
}
