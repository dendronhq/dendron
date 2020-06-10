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
  SchemaData,
  SchemaRawOpts,
  SchemaRawProps
} from "./types";

import YAML from "yamljs";
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

export class DNodeRaw {
  static createProps<T>(opts: DNodeRawOpts<T>): DNodeRawProps<T> {
    const {
      id,
      desc,
      fname,
      updated,
      created,
      parent,
      children,
      body,
      data
    } = _.defaults(opts, {
      updated: "TODO",
      created: "TODO",
      id: genUUID(),
      desc: "",
      children: [],
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

export abstract class DNode<T extends DNodeData> implements IDNode<T> {
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

  constructor(opts: IDNodeOpts<T>) {
    const {
      id,
      title,
      desc,
      fname,
      type,
      updated,
      created,
      body,
      data,
      children
    } = _.defaults(opts, { children: [] }, DNodeRaw.createProps(opts));

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
  }

  get domain(): DNode<T> {
    if (this.parent?.title === "root" || _.isNull(this.parent)) {
      return this;
    }
    return this.parent.domain;
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

  // used in query
  get queryPath(): string {
    if (this.title === "root") {
      return "";
    }
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

  get url(): string {
    return `/doc/${this.id}`;
  }

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
      "data"
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

  get namespace(): boolean {
    return this.data?.namespace || false;
  }

  renderBody() {
    const out = _.map(this.toRawPropsRecursive(), props => {
      return _.pick(props, [
        "id",
        "title",
        "desc",
        "children",
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
