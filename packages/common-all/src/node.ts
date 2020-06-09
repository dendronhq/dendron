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
- id: b111db5b-bc52-4977-893b-307522f89ea3
  title: "foo",
  parent: null
  children:
    - one
*/
export class SchemaNodeRaw {
  static createProps(opts: SchemaRawOpts): SchemaRawProps {
    return DNodeRaw.createProps<SchemaData>(opts);
  }
}

export abstract class DNode<T = DNodeData> implements IDNode<T> {
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
    const parent = this.parent?.id ?? null;
    const children = this.children.map(c => c.id);
    return { ...props, parent, children };
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

  // match(identifier: string) {
  //   // TODO
  //   throw Error("implement");
  //   // id, title, alias
  // }
}

export class Schema extends DNode<SchemaData> implements ISchema {
  public namespace: boolean;

  static createRoot() {
    const props = SchemaNodeRaw.createProps({ fname: "root" });
    return new Schema({ ...props, parent: null, children: [] });
  }

  constructor(props: ISchemaOpts) {
    const dataDefaults = {
      namespace: false
    };
    super({
      type: "schema",
      ..._.defaults(props, {
        parent: null,
        children: [],
        data: dataDefaults
      })
    });
    this.namespace = props.data?.namespace || dataDefaults.namespace;
  }

  _renderBody(): any[] {
    const parent = _.pick(this, ["id", "namespace", "title"]);
    // @ts-ignore
    const children = this.children.map((ch: Schema) => ch._renderBody());
    const out = [parent].concat(children);
    return out.flat();
  }

  renderBody() {
    const out = this._renderBody();
    return "```" + YAML.stringify(out, 4) + "```";
  }

  // match(identifier: string) {
  //   // id, title, alias
  //   return _.some([this.title === identifier]);
  // }
}

// === Old
// export class SchemaStubWrapper {
//   static fromSchemaNode(node: SchemaNode): SchemaNodeStub {
//     return _.omit(node, "children", "parent");
//   }

//   static fromSchemaYAMLEntry(
//     entry: SchemaYAMLEntryRaw,
//     opts: YAMLEntryOpts
//   ): SchemaNodeStub {
//     const { id } = opts;
//     const schemaDataKeysDefaults: {
//       [key in SchemaDataKey]: any;
//     } = {
//       aliases: [],
//       kind: undefined,
//       choices: [],
//       title: id,
//       desc: "",
//       type: "schema",
//     };
//     //const title = entry.title ? entry.title : entry.id;

//     const data = _.defaults(
//       {},
//       _.omit(entry, "children"),
//       schemaDataKeysDefaults
//     );
//     const schemaNode = { data, id };
//     return schemaNode;
//   }
// }

// export class SchemaNodeWrapper {
//   static fromSchemaYAMLEntry(
//     entry: SchemaYAMLEntryRaw,
//     opts: YAMLEntryOpts
//   ): SchemaNode {
//     entry = _.defaults(entry, { children: [] });
//     const schemaStub = SchemaStubWrapper.fromSchemaYAMLEntry(entry, opts);
//     const parent = null;
//     const children = _.map(entry.children, (entry, id: string) => {
//       return SchemaStubWrapper.fromSchemaYAMLEntry(entry, { id });
//     });
//     const schemaNode = { ...schemaStub, parent, children };
//     return schemaNode;
//   }

//   // static deserialize(yamlString: string): SchemaTree {
//   //   const schema: SchemaYAML = YAML.parse(yamlString);
//   //   const tree = SchemaTree.fromSchemaYAML(schema);
//   //   return tree;
//   // }
// }

// export class NodeWrapper {
//   public node: DNode;
//   constructor(node: DNode) {
//     this.node = node;
//   }

//   static renderBody(node: DNode) {
//     return node.body || "";
//   }
// }

// export class SchemaTree {
//   public name: string;
//   public root: SchemaNode;
//   public nodes: SchemaNodeDict;

//   constructor(name: string, root: SchemaNode, nodes?: SchemaNodeDict) {
//     this.name = name;
//     this.root = root;
//     this.nodes = _.cloneDeep(nodes) || {};
//     this.addChild(root, null);
//   }

//   /**
//    * Add a subtree and merge all nodes
//    * @param tree
//    * @param parent
//    */
//   addSubTree(tree: SchemaTree, id: string) {
//     const parent = this.nodes[id];
//     this.addChild(tree.root, parent);
//     this.nodes = _.merge(this.nodes, tree.nodes);
//   }

//   addChild(child: SchemaNode, parent: SchemaNode | null) {
//     const childStub = SchemaStubWrapper.fromSchemaNode(child);
//     if (parent) {
//       const parentNode = this.nodes[parent.id];
//       if (_.isUndefined(parentNode)) {
//         throw `no parent with ${parent.id} found`;
//       }
//       parentNode.children.push(childStub);
//     }
//     this.nodes[child.id] = child;
//   }

//   static fromSchemaYAML(yamlString: string): SchemaTree {
//     const schemaYAML: SchemaYAMLRaw = YAML.parse(yamlString);
//     const { name, schema } = schemaYAML;

//     const root = SchemaNodeWrapper.fromSchemaYAMLEntry(schema.root, {
//       id: name,
//     });
//     const tree = new SchemaTree(name, root);

//     const unvisited: SchemaNode[] = [root];
//     while (!_.isEmpty(unvisited)) {
//       const parent: SchemaNode = unvisited.pop() as SchemaNode;
//       _.map(parent.children, ({ id: childId }: SchemaNodeStub) => {
//         // @ts-ignore
//         const entry: SchemaYAMLEntryRaw = schema[childId];

//         const childNode = SchemaNodeWrapper.fromSchemaYAMLEntry(entry, {
//           id: childId,
//         });
//         // NOTE: parent relationships already defined in yaml
//         tree.addChild(childNode, null);
//         unvisited.push(childNode);
//       });
//     }
//     return tree;
//   }

//   toAntDTree() {
//     const schemaNode2AntDNode = (
//       node: SchemaNode,
//       nodeDict: SchemaNodeDict
//     ): DataNode => {
//       const { title } = node.data;
//       const { id } = node;
//       return {
//         title,
//         key: id,
//         children: _.map(node.children, (ch) =>
//           schemaNode2AntDNode(nodeDict[ch.id], nodeDict)
//         ),
//       };
//     };
//     const out = schemaNode2AntDNode(this.root, this.nodes);
//     // replace `root` with name of schema
//     out.title = this.name;
//     return out;
//   }

//   toD3Tree() {
//     const schemaNode2D3Node = (
//       node: SchemaNode,
//       nodeDict: SchemaNodeDict
//     ): ReactD3TreeItemV2<any> => {
//       const { title } = node.data;
//       const { id } = node;
//       return {
//         name: title,
//         id,
//         attributes: {},
//         children: _.map(node.children, (ch) =>
//           schemaNode2D3Node(nodeDict[ch.id], nodeDict)
//         ),
//       };
//     };
//     const out = schemaNode2D3Node(this.root, this.nodes);
//     // replace `root` with name of schema
//     out.name = this.name;
//     return out;
//   }
// }
