import _, { entries } from "lodash";
import minimatch from "minimatch";
import moment from "moment";
import { DNode } from "./node";
import {
  DNodePropsDictV2,
  DNodePropsQuickInputV2,
  DNodePropsV2,
  SchemaData,
  SchemaPropsDictV2,
  SchemaPropsV2,
} from "./types";
import { genUUID } from "./uuid";

export class DNodeUtilsV2 {
  static create(props: Partial<DNodePropsV2>): DNodePropsV2 {
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
      data,
    } = _.defaults(props, {
      updated: moment.now(),
      created: moment.now(),
      id: genUUID(),
      desc: "",
      children: [],
      parent: null,
      body: "",
      data: {},
      fname: null,
    });
    const title = props.title || DNode.defaultTitle(fname);
    const cleanProps: DNodePropsV2 = {
      id,
      title,
      desc,
      fname,
      updated,
      created,
      parent,
      children,
      body,
      data,
    };
    if (stub) {
      cleanProps.stub = stub;
    }
    const denylist = ["schemaStub", "type"];
    const custom = _.omit(props, _.keys(cleanProps).concat(denylist));
    if (!_.isEmpty(custom)) {
      cleanProps.custom = custom;
    }
    return cleanProps;
  }

  static enhanceWithLabel(props: DNodePropsV2[]): DNodePropsQuickInputV2[] {
    return props.map((ent) => ({ ...ent, label: ent.title }));
  }

  static getDomain(
    node: DNodePropsV2,
    opts: {
      nodeDict: DNodePropsDictV2;
    }
  ): DNodePropsV2 {
    if (node.id === "root") {
      throw Error("root has no domain");
    }
    if (node.parent === "root") {
      return node;
    } else {
      return DNodeUtilsV2.getDomain(DNodeUtilsV2.getParent(node, opts), opts);
    }
  }

  static getParent(
    node: DNodePropsV2,
    opts: {
      nodeDict: DNodePropsDictV2;
    }
  ): DNodePropsV2 {
    if (node.id === "root") {
      throw Error("root has no parent");
    }
    const parent = opts.nodeDict[node.parent as string];
    if (_.isUndefined(parent)) {
      throw Error(`parent ${node.parent} not found`);
    }
    return parent;
  }

  static getChildren(
    node: DNodePropsV2,
    opts: {
      recursive?: boolean;
      nodeDict: DNodePropsDictV2;
    }
  ): DNodePropsV2[] {
    const { nodeDict, recursive } = opts;
    const children = node.children.map((id) => {
      if (!_.has(nodeDict, id)) {
        throw Error("child nod found");
      }
      return nodeDict[id];
    });
    if (recursive) {
      return children.concat(
        children.map((c) => DNodeUtilsV2.getChildren(c, opts)).flat()
      );
    }
    return children;
  }
}

export class SchemaUtilsV2 {
  static create(opts: SchemaPropsV2) {
    if (opts.fname.indexOf(".schema") < 0) {
      opts.fname += ".schema";
    }
    const schemaDataOpts: (keyof SchemaData)[] = [
      "namespace",
      "pattern",
      "template",
    ];
    const optsWithoutData = _.omit(opts, schemaDataOpts);
    const optsData = _.pick(opts, schemaDataOpts);
    // TODO
    return { optsWithoutData, optsData };
  }

  /**
   *
   * @param noteOrPath
   * @param schemas
   * @param opts
   *   - matchNamespace: should match exact namespace note (in addition to wildcard), default: false
   *   - matchPrefix: allow prefix match, default: false
   */
  static matchNote(
    noteOrPath: DNodePropsV2 | string,
    schemas: SchemaPropsDictV2,
    opts?: { matchNamespace?: boolean; matchPrefix?: boolean }
  ): DNodePropsV2 {
    const cleanOpts = _.defaults(opts, {
      matchNamespace: true,
      matchPrefix: false,
    });
    const schemaList = _.isArray(schemas) ? schemas : _.values(schemas);
    const notePath = _.isString(noteOrPath) ? noteOrPath : noteOrPath.fname;
    const notePathClean = notePath.replace(/\./g, "/");
    let match: DNodePropsV2 | undefined;
    _.find(schemaList, (schemaDomain) => {
      // @ts-ignore
      const allMatches = [schemaDomain].concat(
        DNodeUtilsV2.getChildren(schemaDomain, {
          recursive: true,
          nodeDict: schemas,
        })
      );
      return _.some(schemaDomain.nodes, (schema) => {
        const patternMatch = schema.patternMatch;
        if (
          (schema as SchemaPropsV2).data.namespace &&
          cleanOpts.matchNamespace
        ) {
          if (minimatch(notePathClean, _.trimEnd(patternMatch, "/*"))) {
            match = schema;
            return true;
          }
        }
        if (minimatch(notePathClean, patternMatch)) {
          match = schema;
          return true;
        } else {
          return false;
        }
      });
    });
    if (_.isUndefined(match)) {
      throw Error("not implemented");
    }
    return match;
  }
}
