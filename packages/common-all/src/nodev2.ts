import matter from "gray-matter";
import _ from "lodash";
import minimatch from "minimatch";
import moment from "moment";
import YAML from "yamljs";
import { ENGINE_ERROR_CODES } from "./constants";
import { DendronError } from "./error";
import { DNode } from "./node";
import {
  DNodeOptsV2,
  DNodePropsDictV2,
  DNodePropsQuickInputV2,
  DNodePropsV2,
  NoteOptsV2,
  NotePropsDictV2,
  NotePropsV2,
  SchemaDataV2,
  SchemaModulePropsV2,
  SchemaOptsV2,
  SchemaPropsDictV2,
  SchemaPropsV2,
} from "./typesv2";
import { genUUID } from "./uuid";

export class DNodeUtilsV2 {
  static addChild(parent: DNodePropsV2, child: DNodePropsV2) {
    parent.children = Array.from(new Set(parent.children).add(child.id));
    child.parent = parent.id;
  }

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

  static dirName(nodePath: string) {
    return nodePath.split(".").slice(0, -1).join(".");
  }

  static enhancePropForQuickInput(props: DNodePropsV2): DNodePropsQuickInputV2 {
    return { ...props, label: props.title };
  }

  static enhancePropsForQuickInput(
    props: DNodePropsV2[]
  ): DNodePropsQuickInputV2[] {
    return props.map(DNodeUtilsV2.enhancePropForQuickInput);
  }

  static findClosestParent(
    fpath: string,
    nodes: DNodePropsDictV2
  ): DNodePropsV2 {
    const dirname = DNodeUtilsV2.dirName(fpath);
    if (dirname === "") {
      return nodes["root"] as DNodePropsV2;
    }
    const maybeNode = _.find(nodes, { fname: dirname });
    if (maybeNode) {
      return maybeNode;
    } else {
      return DNodeUtilsV2.findClosestParent(dirname, nodes);
    }
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

export class NoteUtilsV2 {
  static create(opts: NoteOptsV2): NotePropsV2 {
    const cleanOpts = _.defaults(opts, {
      schemaStub: false,
    });
    return DNodeUtilsV2.create({ ...cleanOpts, type: "note" });
  }

  static createRoot(opts: Partial<NoteOptsV2>): NotePropsV2 {
    return DNodeUtilsV2.create({
      ...opts,
      type: "note",
      fname: "root",
      id: "root",
    });
  }

  static createStubs(from: NotePropsV2, to: NotePropsV2): NotePropsV2[] {
    const stubNodes: NotePropsV2[] = [];
    let fromPath = from.fname;
    if (from.id === "root") {
      fromPath = "";
    }
    const toPath = to.fname;
    const index = toPath.indexOf(fromPath) + fromPath.length;
    const diffPath = _.trimStart(toPath.slice(index), ".").split(".");
    let stubPath = fromPath;
    let parent = from;
    // last element is node
    diffPath.slice(0, -1).forEach((part) => {
      // handle starting from root, path = ""
      if (_.isEmpty(stubPath)) {
        stubPath = part;
      } else {
        stubPath += `.${part}`;
      }
      const n = NoteUtilsV2.create({ fname: stubPath, stub: true });
      stubNodes.push(n);
      DNodeUtilsV2.addChild(parent, n);
      parent = n;
    });
    DNodeUtilsV2.addChild(parent, to);
    return stubNodes;
  }

  static getNoteByFname(
    fname: string,
    notes: NotePropsDictV2,
    opts?: { throwIfEmpty: boolean }
  ): NotePropsV2 | undefined {
    const out = _.find(
      _.values(notes),
      (ent) => ent.fname.toLowerCase() === fname
    );
    if (opts?.throwIfEmpty && _.isUndefined(out)) {
      throw Error(`${fname} not found`);
    }
    return out;
  }

  static serialize(props: NotePropsV2): string {
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
    return matter.stringify(body || "", meta);
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

  static createModule(opts: SchemaModulePropsV2): SchemaModulePropsV2 {
    return opts;
  }

  static createRootModule(opts?: Partial<SchemaPropsV2>): SchemaModulePropsV2 {
    const schema = SchemaUtilsV2.create({
      id: "root",
      title: "root",
      fname: "root.schema",
      parent: null,
      children: [],
      ...opts,
    });
    return {
      version: 1,
      imports: [],
      schemas: [schema],
    };
  }

  static getModuleFname(module: SchemaModulePropsV2): string {
    return SchemaUtilsV2.getModuleRoot(module).fname;
  }

  static getModuleRoot(module: SchemaModulePropsV2): SchemaPropsV2 {
    const maybeRoot = _.find(module.schemas, { parent: "root" });
    if (!maybeRoot) {
      const rootSchemaRoot = _.find(module.schemas, {
        parent: null,
        id: "root",
      });
      if (!rootSchemaRoot) {
        throw new DendronError({
          status: ENGINE_ERROR_CODES.NO_ROOT_SCHEMA_FOUND,
        });
      } else {
        return rootSchemaRoot as SchemaPropsV2;
      }
    }
    return maybeRoot as SchemaPropsV2;
  }

  static serializeModule(moduleProps: SchemaModulePropsV2) {
    const { version, imports, schemas } = moduleProps;
    const out = {
      version,
      imports,
      schemas,
    };
    return YAML.stringify(out, undefined, 4);
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
