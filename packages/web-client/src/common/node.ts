import {
  SchemaDataKey,
  SchemaNode,
  SchemaNodeStub,
  SchemaYAML,
  SchemaYAMLEntry,
} from "./types";

import YAML from "yamljs";
import _ from "lodash";

interface DataDefaults {
  default: any;
}

export class SchemaStubWrapper {
  static fromSchemaNode(node: SchemaNode): SchemaNodeStub {
    return _.omit(node, "children", "parent");
  }

  static fromSchemaYAMLEntry(entry: SchemaYAMLEntry): SchemaNodeStub {
    const { id } = entry;
    const schemaDataKeysDefaults: {
      [key in SchemaDataKey]: any;
    } = {
      aliases: [],
      kind: undefined,
      choices: [],
      title: id,
      desc: "",
    };
    //const title = entry.title ? entry.title : entry.id;

    const data = _.defaults(
      {},
      _.omit(entry, "children"),
      schemaDataKeysDefaults
    );
    const logicalId = id;
    const schemaNode = { data, id, logicalId };
    return schemaNode;
  }
}

export class SchemaNodeWrapper {
  static fromSchemaYAMLEntry(entry: SchemaYAMLEntry): SchemaNode {
    const schemaStub = SchemaStubWrapper.fromSchemaYAMLEntry(entry);
    const parent = null;
    const children: any[] = [];
    const schemaNode = { ...schemaStub, parent, children };
    return schemaNode;
  }

  // static deserialize(yamlString: string): SchemaTree {
  //   const schema: SchemaYAML = YAML.parse(yamlString);
  //   const tree = SchemaTree.fromSchemaYAML(schema);
  //   return tree;
  // }
}

export class SchemaTree {
  public name: string;
  public root: SchemaNode;
  public nodes: { [key: string]: SchemaNode };

  constructor(name: string, root: SchemaNode) {
    this.name = name;
    this.root = root;
    this.nodes = {};
  }

  addChild(child: SchemaNode, parent: SchemaNode) {
    const parentNode = this.nodes[parent.logicalId];
    if (_.isUndefined(parentNode)) {
      throw `no parent with ${parent.id} found`;
    }
    const childStub = SchemaStubWrapper.fromSchemaNode(child);
    parentNode.children.push(childStub);
    this.nodes[child.logicalId] = child;
  }

  static fromSchemaYAML(yamlString: string): SchemaTree {
    const schemaYAML: SchemaYAML = YAML.parse(yamlString);
    const { name, schema } = schemaYAML;

    const root = SchemaNodeWrapper.fromSchemaYAMLEntry({
      ...schema.root,
      id: "root",
    });
    const tree = new SchemaTree(name, root);
    let parent = root;
    _.map(tree.root.children, (v: any, childId: string) => {
      // @ts-ignore
      const entry: SchemaYAMLEntry = schema[childId];

      const childNode = SchemaNodeWrapper.fromSchemaYAMLEntry({
        ...entry,
        id: entry.id,
      });
      tree.addChild(childNode, parent);
    });
    // tree.root.children.forEach((childId: string) => {
    //   const childEntry = schema[childId];
    // });
    return tree;
  }

  toD3Tree() {
    // TODO
    return;
  }
}
