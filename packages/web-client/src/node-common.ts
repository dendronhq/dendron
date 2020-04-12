import { SchemaYAML } from "./types-common";
import YAML from "yamljs";
export class SchemaNode {
  static deserialize(yamlString: string) {
    const nodes = {};
    const schema: SchemaYAML = YAML.parse(yamlString);
    const { name, schema: _schema } = schema;
    return schema;
  }
}

export class SchemaTree {
  public root: SchemaNode;
  constructor(root: SchemaNode) {
    this.root = root;
  }
}
