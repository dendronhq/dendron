import _ from "lodash";
import minimatch from "minimatch";
import moment from "moment";
import { DNode } from "./node";
import {
  DEngineV2,
  DNodeOptsV2,
  DNodePropsDictV2,
  DNodePropsQuickInputV2,
  DNodePropsV2,
  NoteOptsV2,
  NotePropsV2,
  SchemaDataV2,
  SchemaOptsV2,
  SchemaPropsDictV2,
  SchemaPropsV2,
} from "./typesv2";
import { genUUID } from "./uuid";

export class DNodeUtilsV2 {
  static create(opts: DNodeOptsV2): DNodePropsV2 {
    const {
      id,
      type,
      desc,
      fname,
      updated,
      created,
      parent,
      stub,
      children,
      body,
      data,
    } = _.defaults(opts, {
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
    const title = opts.title || DNode.defaultTitle(fname);
    const cleanProps: DNodePropsV2 = {
      id,
      title,
      type,
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
    const custom = _.omit(opts, _.keys(cleanProps).concat(denylist));
    if (!_.isEmpty(custom)) {
      cleanProps.custom = custom;
    }
    return cleanProps;
  }

  static enhancePropForQuickInput(props: DNodePropsV2): DNodePropsQuickInputV2 {
    return { ...props, label: props.title };
  }

  static enhancePropsForQuickInput(
    props: DNodePropsV2[]
  ): DNodePropsQuickInputV2[] {
    return props.map(DNodeUtilsV2.enhancePropForQuickInput);
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

  static getNoteByFname(
    fname: string,
    engine: DEngineV2,
    opts?: { throwIfEmpty: boolean }
  ): NotePropsV2 | undefined {
    const out = _.find(
      _.values(engine.notes),
      (ent) => ent.fname.toLowerCase() === fname
    );
    if (opts?.throwIfEmpty && _.isUndefined(out)) {
      throw Error(`${fname} not found`);
    }
    return out;
  }
}

export class NoteUtilsV2 {
  static create(opts: NoteOptsV2): NotePropsV2 {
    const cleanOpts = _.defaults(opts, {
      schemaStub: false,
    });
    return DNodeUtilsV2.create({ ...cleanOpts, type: "note" });
  }

  static serialize(props: NotePropsV2) {
    const body = props.body;
    const builtinProps = _.pick(props, [
      "id",
      "title",
      "desc",
      "updated",
      "created",
      "stub",
    ]);
    const { custom: customProps } = props;
    const meta = { ...builtinProps, ...customProps };
    return {
      meta,
      body,
    };
  }
}

export class SchemaUtilsV2 {
  static create(opts: SchemaOptsV2): SchemaPropsV2 {
    if (opts.fname.indexOf(".schema") < 0) {
      opts.fname += ".schema";
    }
    const schemaDataOpts: (keyof SchemaDataV2)[] = [
      "namespace",
      "pattern",
      "template",
    ];
    const optsWithoutData = _.omit(opts, schemaDataOpts) as SchemaOptsV2;
    const optsData = _.pick(opts, schemaDataOpts);
    return DNodeUtilsV2.create({
      ..._.defaults(optsWithoutData, {
        title: optsWithoutData.id,
        data: optsData,
      }),
      type: "schema",
    });
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
