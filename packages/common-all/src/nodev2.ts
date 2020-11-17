import matter from "gray-matter";
import YAML, { JSON_SCHEMA } from "js-yaml";
import _ from "lodash";
import minimatch from "minimatch";
import moment from "moment";
import path from "path";
import { URI } from "vscode-uri";
import { ENGINE_ERROR_CODES } from "./constants";
import { DendronError } from "./error";
import { DNoteLoc, DVault, SchemaTemplate } from "./typesv2";
import {
  DEngineClientV2,
  DLoc,
  DNodeOptsV2,
  DNodePropsDictV2,
  DNodePropsQuickInputV2,
  DNodePropsV2,
  NoteOptsV2,
  NotePropsDictV2,
  NotePropsV2,
  SchemaDataV2,
  SchemaModuleDictV2,
  SchemaModuleOptsV2,
  SchemaModulePropsV2,
  SchemaOptsV2,
  SchemaPropsDictV2,
  SchemaPropsV2,
  SchemaRawV2,
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
      links,
      fname,
      updated,
      created,
      parent,
      children,
      body,
      data,
      vault,
    } = _.defaults(opts, {
      updated: moment.now(),
      created: moment.now(),
      id: genUUID(),
      desc: "",
      links: [],
      children: [],
      parent: null,
      body: "",
      data: {},
      fname: null,
    });
    const title = opts.title || NoteUtilsV2.genTitle(fname);
    const cleanProps: DNodePropsV2 = {
      id,
      title,
      vault,
      type,
      desc,
      links,
      fname,
      updated,
      created,
      parent,
      children,
      body,
      data,
    };

    // don't include optional props
    const optionalProps: (keyof DNodeOptsV2)[] = [
      "stub",
      "schema",
      "schemaStub",
      "custom",
    ];
    _.forEach(optionalProps, (op) => {
      if (opts[op]) {
        cleanProps[op] = opts[op];
      }
    });
    return cleanProps;
  }

  static basename(nodePath: string, rmExtension?: boolean) {
    if (rmExtension) {
      const idx = nodePath.lastIndexOf(".md");
      if (idx > 0) {
        nodePath = nodePath.slice(0, idx);
      }
    }
    const [first, ...rest] = nodePath.split(".");
    return _.isEmpty(rest) ? first : rest.slice(-1)[0];
  }

  static dirName(nodePath: string) {
    return nodePath.split(".").slice(0, -1).join(".");
  }

  static domainName(nodePath: string) {
    return nodePath.split(".")[0];
  }

  static fname(nodePath: string) {
    return path.basename(nodePath, ".md");
  }

  static enhancePropForQuickInput({
    props,
    schemas,
    vaults,
  }: {
    props: DNodePropsV2;
    schemas: SchemaModuleDictV2;
    vaults: DVault[];
  }): DNodePropsQuickInputV2 {
    const vaultSuffix =
      vaults.length > 1
        ? ` (${path.basename(props.vault?.fsPath as string)})`
        : "";
    if (props.type === "note") {
      const isRoot = DNodeUtilsV2.isRoot(props);
      const label = isRoot ? "root" : props.fname;
      const detail = props.desc;
      const sm = props.schema ? schemas[props.schema.moduleId] : undefined;
      const description = NoteUtilsV2.genSchemaDesc(props, sm) + vaultSuffix;
      const out = { ...props, label, detail, description };
      return out;
    } else {
      const label = DNodeUtilsV2.isRoot(props) ? "root" : props.id;
      const detail = props.desc;
      const out = { ...props, label, detail, description: vaultSuffix };
      return out;
    }
  }

  static findClosestParent(
    fpath: string,
    nodes: DNodePropsV2[],
    opts: {
      noStubs?: boolean;
      vault: DVault;
    }
  ): DNodePropsV2 {
    const { vault } = opts;
    const dirname = DNodeUtilsV2.dirName(fpath);
    if (dirname === "") {
      const _nodes = _.filter(nodes, {
        fname: "root",
        vault,
      }) as DNodePropsV2[];
      if (_nodes.length > 1) {
        throw new DendronError({
          msg: `findClosestParent issue: multiple root notes found for ${fpath}`,
        });

        const node = _.find(
          _nodes,
          (ent) => ent.vault?.fsPath === vault.fsPath
        );
        if (_.isUndefined(node)) {
          throw new DendronError({
            msg: `findClosestParent issue: multiple root notes found for ${fpath}`,
          });
        }
      } else {
        return nodes[0];
      }
    }
    const maybeNode = _.find(nodes, { fname: dirname });
    if (
      (maybeNode && !opts?.noStubs) ||
      (maybeNode && opts?.noStubs && !maybeNode.stub && !maybeNode.schemaStub)
    ) {
      return maybeNode;
    } else {
      return DNodeUtilsV2.findClosestParent(dirname, nodes, opts);
    }
  }

  static getCustomProps(props: any): any {
    const blacklist = [
      "id",
      "title",
      "type",
      "desc",
      "fname",
      "updated",
      "custom",
      "created",
      "parent",
      "children",
      "body",
      "data",
      "schemaStub",
      "type",
    ];
    return _.omit(props, blacklist);
  }

  static getDepth(node: DNodePropsV2): number {
    if (node.fname === "root") {
      return 0;
    }
    return node.fname.split(".").length;
  }

  static getDomain(
    node: DNodePropsV2,
    opts: {
      nodeDict: DNodePropsDictV2;
    }
  ): DNodePropsV2 {
    if (node.fname === "root") {
      throw Error("root has no domain");
    }
    const isRoot = DNodeUtilsV2.isRoot(opts.nodeDict[node.parent as string]);
    if (isRoot) {
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
    if (DNodeUtilsV2.isRoot(node)) {
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

  static getVaultByDir({
    vaults,
    dirPath,
  }: {
    dirPath: string;
    vaults: DVault[];
  }) {
    const vault = _.find(vaults, { fsPath: dirPath });
    if (_.isUndefined(vault)) {
      throw new DendronError({ msg: `no vault found. ${dirPath}, ${vaults}` });
    }
    return vault;
  }

  static isRoot(note: DNodePropsV2) {
    return note.fname === "root";
  }
}

export class NoteUtilsV2 {
  static RE_FM = /^---(.*)^---/ms;
  static RE_FM_UPDATED = /^updated:.*$/m;
  static RE_FM_CREATED = /^created:.*$/m;
  /**
   * Add node to parent
   * Create stubs if no direct parent exists
   * @param opts
   * @returns All notes that were changed including the parent
   */
  static addParent(opts: {
    note: NotePropsV2;
    notesList: NotePropsV2[];
    createStubs: boolean;
  }): NotePropsV2[] {
    const { note, notesList, createStubs } = opts;
    const parentPath = DNodeUtilsV2.dirName(note.fname);
    let parent = _.find(notesList, (p) => p.fname === parentPath) || null;
    const changed: NotePropsV2[] = [];
    if (parent) {
      changed.push(parent);
      DNodeUtilsV2.addChild(parent, note);
    }
    if (!parent && !createStubs) {
      const err = {
        status: ENGINE_ERROR_CODES.NO_PARENT_FOR_NOTE,
        msg: JSON.stringify({
          fname: note.fname,
        }),
      };
      throw new DendronError(err);
    }
    if (!parent) {
      parent = DNodeUtilsV2.findClosestParent(note.fname, notesList, {
        vault: note.vault,
      }) as NotePropsV2;
      changed.push(parent);
      const stubNodes = NoteUtilsV2.createStubs(parent, note);
      stubNodes.forEach((ent2) => {
        changed.push(ent2);
      });
    }
    return changed;
  }

  static addSchema(opts: {
    note: NotePropsV2;
    schemaModule: SchemaModulePropsV2;
    schema: SchemaPropsV2;
  }) {
    const { note, schema, schemaModule } = opts;
    note.schema = { schemaId: schema.id, moduleId: schemaModule.root.id };
  }

  static create(opts: NoteOptsV2): NotePropsV2 {
    const cleanOpts = _.defaults(opts, {
      schemaStub: false,
    });
    return DNodeUtilsV2.create({ ...cleanOpts, type: "note" });
  }

  static createWithSchema({
    noteOpts,
    engine,
  }: {
    noteOpts: NoteOptsV2;
    engine: DEngineClientV2;
  }): NotePropsV2 {
    const note = NoteUtilsV2.create(noteOpts);
    const maybeMatch = SchemaUtilsV2.matchPath({
      notePath: noteOpts.fname,
      schemaModDict: engine.schemas,
    });
    if (maybeMatch) {
      const { schema, schemaModule } = maybeMatch;
      NoteUtilsV2.addSchema({ note, schemaModule, schema });
      const maybeTemplate = schema.data.template;
      if (maybeTemplate) {
        SchemaUtilsV2.applyTemplate({ template: maybeTemplate, note, engine });
      }
    }
    return note;
  }

  static createRoot(
    opts: Partial<NoteOptsV2> & { vault: DVault }
  ): NotePropsV2 {
    return DNodeUtilsV2.create({
      ...opts,
      type: "note",
      fname: "root",
      id: genUUID(),
    });
  }

  /**
   * Create stubs and add notes to parent
   * @param from
   * @param to
   */
  static createStubs(from: NotePropsV2, to: NotePropsV2): NotePropsV2[] {
    const stubNodes: NotePropsV2[] = [];
    let fromPath = from.fname;
    if (DNodeUtilsV2.isRoot(from)) {
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
      const n = NoteUtilsV2.create({
        fname: stubPath,
        stub: true,
        vault: to.vault,
      });
      stubNodes.push(n);
      DNodeUtilsV2.addChild(parent, n);
      parent = n;
    });
    DNodeUtilsV2.addChild(parent, to);
    return stubNodes;
  }

  static createWikiLink({ note }: { note: NotePropsV2 }): string {
    const { title, fname } = note;
    const link = `[[${title}|${fname}]]`;
    return link;
  }

  static fromSchema({
    fname,
    schemaModule,
    schemaId,
    vault,
  }: {
    fname: string;
    schemaModule: SchemaModulePropsV2;
    schemaId: string;
    vault: DVault;
  }) {
    const mschema = schemaModule.schemas[schemaId];
    return NoteUtilsV2.create({
      fname,
      schemaStub: true,
      desc: mschema.desc,
      schema: {
        moduleId: schemaModule.root.id,
        schemaId,
      },
      vault,
    });
  }

  static genSchemaDesc(
    note: NotePropsV2,
    schemaMod?: SchemaModulePropsV2
  ): string {
    const prefixParts = [];
    if (note.title !== note.fname) {
      prefixParts.push(note.title);
    }
    if (note.stub || note.schemaStub) {
      prefixParts.push("$(gist-new)");
    }
    if (note.schema) {
      if (!schemaMod) {
        throw Error("schema mod required");
      }
      const domain = schemaMod.root;
      const schema = schemaMod.schemas[note.schema.schemaId];
      // case: recognized schema
      prefixParts.push(`$(repo) ${domain.title || domain.id}`);
      // check if non-domain schema
      if (domain.id !== note.schema.schemaId) {
        prefixParts.push("$(breadcrumb-separator)");
        prefixParts.push(schema.title || schema.id);
      }
    }
    return prefixParts.join(" ");
  }

  static genTitle(fname: string) {
    return _.capitalize(DNodeUtilsV2.basename(fname, true));
  }

  static getNotesByFname({
    fname,
    engine,
    vault,
  }: {
    fname: string;
    engine: DEngineClientV2;
    vault?: DVault;
  }): NotePropsV2[] {
    const notes = engine.notes;
    const out = _.filter(_.values(notes), (ent) => {
      return (
        ent.fname.toLowerCase() === fname.toLowerCase() &&
        (vault ? ent.vault.fsPath === vault.fsPath : true)
      );
    });
    return out;
  }

  static getNoteByFname(
    fname: string,
    notes: NotePropsDictV2,
    opts?: { throwIfEmpty?: boolean; vault?: DVault }
  ): NotePropsV2 | undefined {
    const _out = _.filter(_.values(notes), (ent) => {
      return ent.fname.toLowerCase() === fname.toLowerCase();
    });
    let out;
    if (_out.length > 1) {
      if (!opts?.vault) {
        throw new DendronError({
          msg: `multiple nodes found and no vault given for ${fname}`,
        });
      }
      out = _.find(
        _out,
        (ent) => ent.vault.fsPath === opts?.vault?.fsPath
      ) as NotePropsV2;
      if (_.isUndefined(out)) {
        throw new DendronError({
          msg: `no note found for vault: ${opts.vault.fsPath}`,
        });
      }
    } else {
      out = _out[0];
    }
    if (opts?.throwIfEmpty && _.isUndefined(out)) {
      throw Error(`${fname} not found`);
    }
    return out;
  }
  static getNotesWithLinkTo({
    note,
    notes,
  }: {
    note: NotePropsV2;
    notes: NotePropsDictV2;
  }): NotePropsV2[] {
    const maybe = _.values(notes).map((ent) => {
      if (
        _.find(ent.links, (l) => {
          return l.to?.fname === note.fname;
        })
      ) {
        return ent;
      } else {
        return;
      }
    });
    return _.reject(maybe, _.isUndefined) as NotePropsV2[];
  }

  static getPath({ note }: { note: NotePropsV2 }): string {
    const root = note.vault.fsPath;
    return path.join(root, note.fname + ".md");
  }

  static getPathUpTo(hpath: string, numCompoenents: number) {
    return hpath.split(".").slice(0, numCompoenents).join(".");
  }

  static getRoots(notes: NotePropsDictV2): NotePropsV2[] {
    return _.filter(_.values(notes), DNodeUtilsV2.isRoot);
  }

  static hydrate({
    noteRaw,
    noteHydrated,
  }: {
    noteRaw: NotePropsV2;
    noteHydrated: NotePropsV2;
  }) {
    const hydrateProps = _.pick(noteHydrated, ["parent", "children"]);
    return { ...noteRaw, ...hydrateProps };
  }

  static serializeMeta(props: NotePropsV2) {
    const builtinProps = _.pick(props, [
      "id",
      "title",
      "desc",
      "updated",
      "created",
      "stub",
      "parent",
      "children",
    ]);
    const { custom: customProps } = props;
    const meta = { ...builtinProps, ...customProps };
    return meta;
  }

  static serialize(
    props: NotePropsV2,
    opts?: { writeHierarchy?: boolean }
  ): string {
    const body = props.body;
    let blacklist = ["parent", "children"];
    if (opts?.writeHierarchy) {
      blacklist = [];
    }
    const meta = _.omit(NoteUtilsV2.serializeMeta(props), blacklist);
    return matter.stringify(body || "", meta);
  }

  static toLoc(note: NotePropsV2): DLoc {
    const { fname, id } = note;
    return {
      fname,
      id,
    };
  }

  static toLogObj(note: NotePropsV2) {
    const { fname, id } = note;
    return {
      fname,
      id,
    };
  }

  static toNoteLoc(note: NotePropsV2): DNoteLoc {
    const { fname, id, vault } = note;
    return {
      fname,
      id,
      vault,
    };
  }

  static uri2Fname(uri: URI) {
    return path.basename(uri.fsPath, ".md");
  }
}

type SchemaMatchResult = {
  schemaModule: SchemaModulePropsV2;
  schema: SchemaPropsV2;
  namespace: boolean;
  notePath: string;
};

export class SchemaUtilsV2 {
  static applyTemplate(opts: {
    template: SchemaTemplate;
    note: NotePropsV2;
    engine: DEngineClientV2;
  }) {
    const { template, note, engine } = opts;
    if (template.type === "note") {
      const tempNote = _.find(_.values(engine.notes), { fname: template.id });
      if (_.isUndefined(tempNote)) {
        throw Error(`no template found for ${template}`);
      }
      const tempNoteProps = _.pick(tempNote, ["body", "desc", "custom"]);
      _.forEach(tempNoteProps, (v, k) => {
        // @ts-ignore
        note[k] = v;
      });

      return true;
    }
    return false;
  }

  static create(
    opts: (SchemaOptsV2 | SchemaRawV2) & { vault: DVault }
  ): SchemaPropsV2 {
    const schemaDataOpts: (keyof SchemaDataV2)[] = [
      "namespace",
      "pattern",
      "template",
    ];
    const optsWithoutData = _.omit(opts, schemaDataOpts);
    const optsData = _.pick(opts, schemaDataOpts);
    const vault = opts.vault;
    return DNodeUtilsV2.create({
      vault,
      ..._.defaults(optsWithoutData, {
        title: optsWithoutData.id,
        data: optsData,
        fname: "__empty",
      }),
      type: "schema",
    });
  }

  static createModule(opts: SchemaModuleOptsV2): SchemaModuleOptsV2 {
    return opts;
  }

  static createModuleProps(opts: {
    fname: string;
    vault: DVault;
  }): SchemaModulePropsV2 {
    const { fname, vault } = opts;
    const root = SchemaUtilsV2.create({
      id: `${fname}`,
      fname,
      parent: "root",
      created: "1",
      updated: "1",
      children: [],
      vault,
    });
    return {
      version: 1,
      fname,
      root,
      schemas: { [root.id]: root },
      imports: [],
      vault,
    };
  }

  static createRootModule(
    opts: Partial<SchemaPropsV2> & { vault: DVault }
  ): SchemaModuleOptsV2 {
    const schema = SchemaUtilsV2.create({
      id: "root",
      title: "root",
      fname: "root.schema",
      parent: "root",
      children: [],
      ...opts,
    });
    return {
      version: 1,
      imports: [],
      schemas: [schema],
    };
  }

  static createRootModuleProps(
    fname: string,
    vault: DVault,
    opts?: Partial<SchemaPropsV2>
  ): SchemaModulePropsV2 {
    const schema = SchemaUtilsV2.create({
      id: "root",
      title: "root",
      fname: "root",
      parent: "root",
      children: [],
      vault,
      ...opts,
    });
    return {
      version: 1,
      imports: [],
      schemas: { root: schema },
      fname,
      root: schema,
      vault,
    };
  }

  static enhanceForQuickInput({
    props,
    vaults,
  }: {
    props: SchemaModulePropsV2;
    vaults: DVault[];
  }): DNodePropsQuickInputV2 {
    const vaultSuffix =
      vaults.length > 1
        ? ` (${path.basename(props.vault?.fsPath as string)})`
        : "";
    const label = DNodeUtilsV2.isRoot(props.root) ? "root" : props.root.id;
    const detail = props.root.desc;
    const out = {
      ...props.root,
      label,
      detail,
      description: vaultSuffix,
      vault: props.vault,
    };
    return out;
  }

  static getModuleRoot(
    module: SchemaModuleOptsV2 | SchemaModulePropsV2
  ): SchemaPropsV2 {
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

  static getPattern = (
    schema: SchemaPropsV2,
    opts?: { isNotNamespace?: boolean }
  ) => {
    const pattern = schema?.data?.pattern || schema.id;
    const part =
      schema?.data?.namespace && !opts?.isNotNamespace
        ? `${pattern}/*`
        : pattern;
    return part;
  };

  static getPatternRecursive = (
    schema: SchemaPropsV2,
    schemas: SchemaPropsDictV2
  ): string => {
    const part = SchemaUtilsV2.getPattern(schema);
    if (_.isNull(schema.parent)) {
      return part;
    }
    const parent: SchemaPropsV2 = schemas[schema.parent];
    if (parent && parent.id !== "root") {
      const prefix = SchemaUtilsV2.getPatternRecursive(parent, schemas);
      return [prefix, part].join("/");
    } else {
      return part;
    }
  };

  static getPath({ root, fname }: { root: string; fname: string }): string {
    return path.join(root, fname + ".schema.yml");
  }

  static getSchemaFromNote({
    note,
    engine,
  }: {
    note: NotePropsV2;
    engine: DEngineClientV2;
  }) {
    if (note.schema) {
      return engine.schemas[note.schema.moduleId];
    }
    return;
  }

  static hasSimplePattern = (
    schema: SchemaPropsV2,
    opts?: { isNotNamespace?: boolean }
  ): boolean => {
    const pattern: string = SchemaUtilsV2.getPattern(schema, opts);
    return !_.isNull(pattern.match(/^[a-zA-Z0-9_-]*$/));
  };

  /**
   * Matcn and assign schemas to all nodes within
   * a domain
   *
   * @param domain
   * @param notes
   * @param schemas
   */
  static matchDomain(
    domain: NotePropsV2,
    notes: NotePropsDictV2,
    schemas: SchemaModuleDictV2
  ) {
    const match = schemas[domain.fname];
    if (!match) {
      return;
    } else {
      const domainSchema = match.schemas[match.root.id];
      return SchemaUtilsV2.matchDomainWithSchema({
        noteCandidates: [domain],
        notes,
        schemaCandidates: [domainSchema],
        schemaModule: match,
      });
    }
  }

  static matchDomainWithSchema(opts: {
    noteCandidates: NotePropsV2[];
    notes: NotePropsDictV2;
    schemaCandidates: SchemaPropsV2[];
    schemaModule: SchemaModulePropsV2;
    matchNamespace?: boolean;
  }) {
    const {
      noteCandidates,
      schemaCandidates,
      notes,
      schemaModule,
      matchNamespace,
    } = _.defaults(opts, { matchNamespace: true });
    const matches = _.map(noteCandidates, (note) => {
      return SchemaUtilsV2.matchNotePathWithSchemaAtLevel({
        notePath: note.fname,
        schemas: schemaCandidates,
        schemaModule,
        matchNamespace,
      });
    }).filter((ent) => !_.isUndefined(ent)) as SchemaMatchResult[];

    matches.map((m) => {
      const { schema, notePath } = m;
      const note = _.find(noteCandidates, { fname: notePath }) as NotePropsV2;
      NoteUtilsV2.addSchema({ note, schema, schemaModule });

      const matchNextNamespace =
        schema.data.namespace && matchNamespace ? false : true;
      const nextSchemaCandidates = matchNextNamespace
        ? schema.children.map((id) => schemaModule.schemas[id])
        : [schema];

      const nextNoteCandidates = note.children.map((id) => notes[id]);
      return SchemaUtilsV2.matchDomainWithSchema({
        noteCandidates: nextNoteCandidates,
        schemaCandidates: nextSchemaCandidates,
        notes,
        schemaModule,
        matchNamespace: matchNextNamespace,
      });
    });
  }

  static matchPath(opts: {
    notePath: string;
    schemaModDict: SchemaModuleDictV2;
  }): SchemaMatchResult | undefined {
    const { notePath, schemaModDict } = opts;
    const domainName = DNodeUtilsV2.domainName(notePath);
    const match = schemaModDict[domainName];
    if (!match) {
      return;
    } else {
      const domainSchema = match.schemas[match.root.id];
      if (domainName.length === notePath.length) {
        return {
          schema: domainSchema,
          notePath,
          namespace: domainSchema.data.namespace || false,
          schemaModule: match,
        };
      }
      return SchemaUtilsV2.matchPathWithSchema({
        notePath,
        matched: "",
        schemaCandidates: [domainSchema],
        schemaModule: match,
      });
    }
  }

  /**
   *
   * @param param0
   * @return
   *  - schemaModule
   *  - schema
   *  - namespace
   *  - notePath
   */
  static matchPathWithSchema({
    notePath,
    matched,
    schemaCandidates,
    schemaModule,
    matchNamespace = true,
  }: {
    notePath: string;
    matched: string;
    schemaCandidates: SchemaPropsV2[];
    schemaModule: SchemaModulePropsV2;
    matchNamespace?: boolean;
  }): SchemaMatchResult | undefined {
    const getChildOfPath = (notePath: string, matched: string) => {
      const nextLvlIndex = _.indexOf(notePath, ".", matched.length + 1);
      return nextLvlIndex > 0 ? notePath.slice(0, nextLvlIndex) : notePath;
    };

    const nextNotePath = getChildOfPath(notePath, matched);

    const match = SchemaUtilsV2.matchNotePathWithSchemaAtLevel({
      notePath: nextNotePath,
      schemas: schemaCandidates,
      schemaModule,
      matchNamespace,
    });
    if (match) {
      const { schema, namespace } = match;
      // found a match
      if (notePath === nextNotePath) {
        return {
          schemaModule,
          schema,
          namespace,
          notePath,
        };
      }

      // if current note is a namespace and we are currently matching namespaces, don't match on the next turn
      const matchNextNamespace =
        schema.data.namespace && matchNamespace ? false : true;

      // if we are not matching the next namespace, then we go back to regular matching behavior
      const nextSchemaCandidates = matchNextNamespace
        ? schema.children.map((id) => schemaModule.schemas[id])
        : [schema];
      return SchemaUtilsV2.matchPathWithSchema({
        notePath,
        matched: nextNotePath,
        schemaCandidates: nextSchemaCandidates,
        schemaModule,
        matchNamespace: matchNextNamespace,
      });
    }
    return;
  }

  static matchNotePathWithSchemaAtLevel({
    notePath,
    schemas,
    schemaModule,
    matchNamespace = true,
  }: {
    notePath: string;
    schemas: SchemaPropsV2[];
    schemaModule: SchemaModulePropsV2;
    matchNamespace?: boolean;
  }): SchemaMatchResult | undefined {
    const notePathClean = notePath.replace(/\./g, "/");
    let namespace = false;
    let match = _.find(schemas, (sc) => {
      const pattern = SchemaUtilsV2.getPatternRecursive(
        sc,
        schemaModule.schemas
      );
      if (sc?.data?.namespace && matchNamespace) {
        namespace = true;
        return minimatch(notePathClean, _.trimEnd(pattern, "/*"));
      } else {
        return minimatch(notePathClean, pattern);
      }
    });
    if (match) {
      return {
        schema: match,
        namespace,
        notePath,
        schemaModule,
      };
    }
    return;
  }

  static serializeSchemaProps(
    props: SchemaPropsV2 | SchemaOptsV2
  ): SchemaRawV2 {
    const builtinProps: Omit<SchemaOptsV2, "fname" | "vault"> = _.pick(props, [
      "id",
      "children",
    ]);
    const optional: (keyof Omit<SchemaOptsV2, "fname" | "vault">)[] = [
      "title",
      "desc",
    ];
    _.forEach(optional, (opt) => {
      if (props[opt]) {
        builtinProps[opt] = props[opt];
      }
    });
    const dataProps = props.data;
    // special for root
    if (props?.parent === "root") {
      builtinProps.parent = "root";
    }
    return { ...builtinProps, ...dataProps };
  }

  static serializeModuleProps(moduleProps: SchemaModulePropsV2) {
    const { version, imports, schemas } = moduleProps;
    // TODO: filter out imported schemas
    const out: any = {
      version,
      imports: [],
      schemas: _.values(schemas).map((ent) => this.serializeSchemaProps(ent)),
    };
    if (imports) {
      out.imports = imports;
    }
    return YAML.safeDump(out, { schema: JSON_SCHEMA });
  }
  static serializeModuleOpts(moduleOpts: SchemaModuleOptsV2) {
    const { version, imports, schemas } = _.defaults(moduleOpts, {
      imports: [],
    });
    const out = {
      version,
      imports,
      schemas: _.values(schemas).map((ent) => this.serializeSchemaProps(ent)),
    };
    return YAML.safeDump(out, { schema: JSON_SCHEMA });
  }

  // /**
  //  *
  //  * @param noteOrPath
  //  * @param schemas
  //  * @param opts
  //  *   - matchNamespace: should match exact namespace note (in addition to wildcard), default: false
  //  *   - matchPrefix: allow prefix match, default: false
  //  */
  // static match(
  //   noteOrPath: NotePropsV2| string,
  //   schemas: SchemaModuleV2[],
  //   opts?: { matchNamespace?: boolean; matchPrefix?: boolean }
  // ): SchemaPropsV2 {
  //   const cleanOpts = _.defaults(opts, {
  //     matchNamespace: true,
  //     matchPrefix: false,
  //   });
  //   const notePath = _.isString(noteOrPath) ? noteOrPath : noteOrPath.fname;
  //   const notePathClean = notePath.replace(/\./g, "/");
  //   let match: SchemaPropsV2| undefined;
  //   _.find(schemas, (schemaMod) => {
  //     let schemasToMatch = schemaMod.schemas;
  //     return _.some(schemaDomain.nodes, (schema) => {
  //       const patternMatch = schema.patternMatch;
  //       if (
  //         (schema as SchemaPropsV2).data.namespace &&
  //         cleanOpts.matchNamespace
  //       ) {
  //         if (minimatch(notePathClean, _.trimEnd(patternMatch, "/*"))) {
  //           match = schema;
  //           return true;
  //         }
  //       }
  //       if (minimatch(notePathClean, patternMatch)) {
  //         match = schema;
  //         return true;
  //       } else {
  //         return false;
  //       }
  //     });
  //   });
  //   if (_.isUndefined(match)) {
  //     throw Error("not implemented");
  //   }
  //   return match;
  // }
}
