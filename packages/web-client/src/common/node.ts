import {
  SchemaDataKey,
  SchemaNode,
  SchemaNodeStub,
  SchemaYAMLEntryRaw,
  SchemaYAMLRaw,
} from "./types";

import YAML from "yamljs";
import _ from "lodash";

interface YAMLEntryOpts {
  id: string;
}

export class SchemaStubWrapper {
  static fromSchemaNode(node: SchemaNode): SchemaNodeStub {
    return _.omit(node, "children", "parent");
  }

  static fromSchemaYAMLEntry(
    entry: SchemaYAMLEntryRaw,
    opts: YAMLEntryOpts
  ): SchemaNodeStub {
    const { id } = opts;
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
  static fromSchemaYAMLEntry(
    entry: SchemaYAMLEntryRaw,
    opts: YAMLEntryOpts
  ): SchemaNode {
    entry = _.defaults(entry, { children: [] });
    const schemaStub = SchemaStubWrapper.fromSchemaYAMLEntry(entry, opts);
    const parent = null;
    const children = _.map(entry.children, (entry, id: string) => {
      return SchemaStubWrapper.fromSchemaYAMLEntry(entry, { id });
    });
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
    this.addChild(root, null);
  }

  addChild(child: SchemaNode, parent: SchemaNode | null) {
    const childStub = SchemaStubWrapper.fromSchemaNode(child);
    if (parent) {
      const parentNode = this.nodes[parent.logicalId];
      if (_.isUndefined(parentNode)) {
        throw `no parent with ${parent.id} found`;
      }
      parentNode.children.push(childStub);
    }
    this.nodes[child.logicalId] = child;
  }

  static fromSchemaYAML(yamlString: string): SchemaTree {
    const schemaYAML: SchemaYAMLRaw = YAML.parse(yamlString);
    const { name, schema } = schemaYAML;

    const root = SchemaNodeWrapper.fromSchemaYAMLEntry(schema.root, {
      id: "root",
    });
    const tree = new SchemaTree(name, root);

    const unvisited: SchemaNode[] = [root];
    while (!_.isEmpty(unvisited)) {
      const parent: SchemaNode = unvisited.pop() as SchemaNode;
      _.map(parent.children, ({ id: childId }: SchemaNodeStub) => {
        // @ts-ignore
        const entry: SchemaYAMLEntryRaw = schema[childId];

        const childNode = SchemaNodeWrapper.fromSchemaYAMLEntry(entry, {
          id: childId,
        });
        // NOTE: parent relationships already defined in yaml
        tree.addChild(childNode, null);
        unvisited.push(childNode);
      });
    }
    return tree;
  }

  toD3Tree() {
    // TODO
    return;
  }
}
