import {
  DEngineParser,
  IDNode,
  NoteRawProps,
  SchemaRawOpts,
  SchemaRawProps,
  Schema,
} from "@dendronhq/common-all";

import YAML from "yamljs";
import _ from "lodash";

type BodyParserOpts = {
  fname: string;
  node: IDNode;
};

export class BodyParser implements DEngineParser<BodyParserOpts> {
  parseSchema(data: string, opts: BodyParserOpts): SchemaRawProps[] {
    const { fname, node } = opts;
    data = _.trim(data, "` \\\n");
    const schemaOpts: SchemaRawOpts[] = YAML.parse(data);
    const schemaProps = schemaOpts.map((o) => {
      const nodes = node.toRawPropsRecursive();
      const nodeOrig = _.find(nodes, { id: o.id });
      if (nodeOrig) {
        o = _.merge(o, _.pick(nodeOrig, "parent"));
      } else {
        // new node
        o = _.merge(o, { parent: "root" });
      }
      return Schema.createRawProps({ ...o, fname });
    });
    return schemaProps;
  }

  parseNote(_data: any): NoteRawProps[] {
    // TODO
    return [];
  }
}
