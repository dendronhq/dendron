import matter from "gray-matter";
import YAML, { JSON_SCHEMA } from "js-yaml";
import _ from "lodash";
import minimatch from "minimatch";
import path from "path";
import title from "title";
import { URI } from "vscode-uri";
import { CONSTANTS, ERROR_STATUS } from "./constants";
import { DendronError } from "./error";
import { Time } from "./time";
import {
  DEngineClient,
  DLink,
  DNodeOpts,
  DNodePropsDict,
  DNodePropsQuickInputV2,
  DNodeProps,
  DNoteLoc,
  DVault,
  NoteOpts,
  NotePropsDict,
  NoteProps,
  SchemaData,
  SchemaModuleDict,
  SchemaModuleOpts,
  SchemaModuleProps,
  SchemaOpts,
  SchemaPropsDict,
  SchemaProps,
  SchemaRaw,
  SchemaTemplate,
} from "./types";
import { getSlugger } from "./utils";
import { genUUID } from "./uuid";
import { VaultUtils } from "./vault";
// import fs from "fs-extra";

/**
 * Utilities for dealing with nodes
 */
export class DNodeUtils {
  static addChild(parent: DNodeProps, child: DNodeProps) {
    parent.children = Array.from(new Set(parent.children).add(child.id));
    child.parent = parent.id;
  }

  static create(opts: DNodeOpts): DNodeProps {
    const {
      id,
      type,
      desc,
      links,
      anchors,
      fname,
      updated,
      created,
      parent,
      children,
      body,
      data,
      vault,
    } = _.defaults(opts, {
      updated: Time.now().toMillis(),
      created: Time.now().toMillis(),
      id: genUUID(),
      desc: "",
      links: [],
      anchors: {},
      children: [],
      parent: null,
      body: "",
      data: {},
      fname: null,
    });
    const title = opts.title || NoteUtils.genTitle(fname);
    const cleanProps: DNodeProps = {
      id,
      title,
      vault,
      type,
      desc,
      links,
      anchors,
      fname,
      updated,
      created,
      parent,
      children,
      body,
      data,
    };

    // don't include optional props
    const optionalProps: (keyof DNodeOpts)[] = [
      "stub",
      "schema",
      "schemaStub",
      "custom",
    ];
    _.forEach(optionalProps, (op) => {
      if (opts[op]) {
        // @ts-ignore;
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
    wsRoot,
  }: {
    props: DNodeProps;
    schemas: SchemaModuleDict;
    vaults: DVault[];
    wsRoot: string;
  }): DNodePropsQuickInputV2 {
    const vault = VaultUtils.matchVault({ vaults, wsRoot, vault: props.vault });
    if (!vault) {
      throw Error("enhancePropForQuickInput, no vault found");
    }
    const vname = VaultUtils.getName(vault);
    const vaultSuffix = `(${vname})`;
    if (props.type === "note") {
      const isRoot = DNodeUtils.isRoot(props);
      const label = isRoot ? "root" : props.fname;
      const detail = props.desc;
      const sm = props.schema ? schemas[props.schema.moduleId] : undefined;
      const description = NoteUtils.genSchemaDesc(props, sm) + vaultSuffix;
      const out = { ...props, label, detail, description };
      return out;
    } else {
      const label = DNodeUtils.isRoot(props) ? "root" : props.id;
      const detail = props.desc;
      const out = { ...props, label, detail, description: vaultSuffix };
      return out;
    }
  }

  static enhancePropForQuickInputV3(opts: {
    props: DNodeProps;
    schemas: SchemaModuleDict;
    vaults: DVault[];
    wsRoot: string;
    alwaysShow?: boolean;
  }): DNodePropsQuickInputV2 {
    const { alwaysShow } = _.defaults(opts, { alwaysShow: false });
    return { ...this.enhancePropForQuickInput(opts), alwaysShow };
  }

  static findClosestParent(
    fpath: string,
    nodes: DNodeProps[],
    opts: {
      noStubs?: boolean;
      vault: DVault;
      wsRoot: string;
    }
  ): DNodeProps {
    const { vault } = opts;
    const dirname = DNodeUtils.dirName(fpath);
    if (dirname === "") {
      const _node = _.find(
        nodes,
        (ent) =>
          ent.fname === "root" &&
          VaultUtils.isEqual(ent.vault, vault, opts.wsRoot)
      );
      if (_.isUndefined(_node)) {
        throw new DendronError({ message: `no root found for ${fpath}` });
      }
      return _node;
    }
    const maybeNode = NoteUtils.getNoteByFnameV5({
      fname: dirname,
      notes: nodes,
      vault,
      wsRoot: opts.wsRoot,
    });
    if (
      (maybeNode && !opts?.noStubs) ||
      (maybeNode && opts?.noStubs && !maybeNode.stub && !maybeNode.schemaStub)
    ) {
      return maybeNode;
    } else {
      return DNodeUtils.findClosestParent(dirname, nodes, opts);
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

  static getDepth(node: DNodeProps): number {
    if (node.fname === "root") {
      return 0;
    }
    return node.fname.split(".").length;
  }

  static getDomain(
    node: DNodeProps,
    opts: {
      nodeDict: DNodePropsDict;
    }
  ): DNodeProps {
    if (node.fname === "root") {
      throw Error("root has no domain");
    }
    const isRoot = DNodeUtils.isRoot(opts.nodeDict[node.parent as string]);
    if (isRoot) {
      return node;
    } else {
      return DNodeUtils.getDomain(DNodeUtils.getParent(node, opts), opts);
    }
  }

  static getFullPath(opts: {
    wsRoot: string;
    vault: DVault;
    basename: string;
  }) {
    const root = path.isAbsolute(opts.vault.fsPath)
      ? opts.vault.fsPath
      : path.join(opts.wsRoot, opts.vault.fsPath);
    return path.join(root, opts.basename);
  }

  static getParent(
    node: DNodeProps,
    opts: {
      nodeDict: DNodePropsDict;
    }
  ): DNodeProps {
    if (DNodeUtils.isRoot(node)) {
      throw Error("root has no parent");
    }
    const parent = opts.nodeDict[node.parent as string];
    if (_.isUndefined(parent)) {
      throw Error(`parent ${node.parent} not found`);
    }
    return parent;
  }

  static getChildren(
    node: DNodeProps,
    opts: {
      recursive?: boolean;
      nodeDict: DNodePropsDict;
    }
  ): DNodeProps[] {
    const { nodeDict, recursive } = opts;
    const children = node.children.map((id) => {
      if (!_.has(nodeDict, id)) {
        throw Error("child nod found");
      }
      return nodeDict[id];
    });
    if (recursive) {
      return children.concat(
        children.map((c) => DNodeUtils.getChildren(c, opts)).flat()
      );
    }
    return children;
  }

  static isRoot(note: DNodeProps) {
    return note.fname === "root";
  }

  /**
   * Given a note, return the leaf name
   * @param note DNodeProps
   * @returns name of leaf node
   */
  static getLeafName(note: DNodeProps) {
    return _.split(note.fname, ".").pop();
  }
}

export class NoteUtils {
  static RE_FM = /^---(.*)^---/ms;
  static RE_FM_UPDATED = /^updated:.*$/m;
  static RE_FM_CREATED = /^created:.*$/m;

  static addBacklink({
    from,
    to,
    link,
  }: {
    from: NoteProps;
    to: NoteProps;
    link: DLink;
  }) {
    to.links.push({
      from: { fname: from.fname, vault: from.vault },
      type: "backlink",
      original: link.original,
      pos: link.pos,
      value: link.value,
    });
    // }
  }

  /**
   * Add node to parent
   * Create stubs if no direct parent exists
   * @param opts
   * @returns All notes that were changed including the parent
   */
  static addParent(opts: {
    note: NoteProps;
    notesList: NoteProps[];
    createStubs: boolean;
    wsRoot: string;
  }): NoteProps[] {
    const { note, notesList, createStubs, wsRoot } = opts;
    const parentPath = DNodeUtils.dirName(note.fname).toLowerCase();
    let parent =
      _.find(
        notesList,
        (p) =>
          p.fname.toLowerCase() === parentPath &&
          VaultUtils.isEqual(p.vault.fsPath, note.vault.fsPath, wsRoot)
      ) || null;
    const changed: NoteProps[] = [];
    if (parent) {
      changed.push(parent);
      DNodeUtils.addChild(parent, note);
    }
    if (!parent && !createStubs) {
      const err = {
        status: ERROR_STATUS.NO_PARENT_FOR_NOTE,
        msg: JSON.stringify({
          fname: note.fname,
        }),
      };
      throw DendronError.createFromStatus(err);
    }
    if (!parent) {
      parent = DNodeUtils.findClosestParent(note.fname, notesList, {
        vault: note.vault,
        wsRoot,
      }) as NoteProps;
      changed.push(parent);
      const stubNodes = NoteUtils.createStubs(parent, note);
      stubNodes.forEach((ent2) => {
        changed.push(ent2);
      });
    }
    return changed;
  }

  static addSchema(opts: {
    note: NoteProps;
    schemaModule: SchemaModuleProps;
    schema: SchemaProps;
  }) {
    const { note, schema, schemaModule } = opts;
    note.schema = { schemaId: schema.id, moduleId: schemaModule.root.id };
  }

  static create(opts: NoteOpts): NoteProps {
    const cleanOpts = _.defaults(opts, {
      schemaStub: false,
    });
    return DNodeUtils.create({ ...cleanOpts, type: "note" });
  }

  static createWithSchema({
    noteOpts,
    engine,
  }: {
    noteOpts: NoteOpts;
    engine: DEngineClient;
  }): NoteProps {
    const note = NoteUtils.create(noteOpts);
    const maybeMatch = SchemaUtils.matchPath({
      notePath: noteOpts.fname,
      schemaModDict: engine.schemas,
    });
    if (maybeMatch) {
      const { schema, schemaModule } = maybeMatch;
      NoteUtils.addSchema({ note, schemaModule, schema });
      const maybeTemplate = schema.data.template;
      if (maybeTemplate) {
        SchemaUtils.applyTemplate({ template: maybeTemplate, note, engine });
      }
    }
    return note;
  }

  static createRoot(opts: Partial<NoteOpts> & { vault: DVault }): NoteProps {
    return DNodeUtils.create({
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
  static createStubs(from: NoteProps, to: NoteProps): NoteProps[] {
    const stubNodes: NoteProps[] = [];
    let fromPath = from.fname;
    if (DNodeUtils.isRoot(from)) {
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
      const n = NoteUtils.create({
        fname: stubPath,
        stub: true,
        vault: to.vault,
      });
      stubNodes.push(n);
      DNodeUtils.addChild(parent, n);
      parent = n;
    });
    DNodeUtils.addChild(parent, to);
    return stubNodes;
  }

  static createWikiLink(opts: {
    note: NoteProps;
    header?: string;
    useVaultPrefix?: boolean;
    useTitle?: boolean;
  }): string {
    const { note, header, useVaultPrefix, useTitle } = _.defaults(opts, {
      useTitle: true,
    });
    let { title, fname, vault } = note;
    let suffix = "";
    const slugger = getSlugger();
    if (header) {
      suffix = "#" + slugger.slug(header);
    }
    if (header) {
      title = header;
    }
    const vaultPrefix = useVaultPrefix
      ? `${CONSTANTS.DENDRON_DELIMETER}${VaultUtils.getName(vault)}/`
      : "";
    const titlePrefix = useTitle ? title + "|" : "";
    const link = `[[${titlePrefix}${vaultPrefix}${fname}${suffix}]]`;
    return link;
  }

  static fromSchema({
    fname,
    schemaModule,
    schemaId,
    vault,
  }: {
    fname: string;
    schemaModule: SchemaModuleProps;
    schemaId: string;
    vault: DVault;
  }) {
    const mschema = schemaModule.schemas[schemaId];
    return NoteUtils.create({
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

  static genSchemaDesc(note: NoteProps, schemaMod?: SchemaModuleProps): string {
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

  static genJournalNoteTitle(opts: { fname: string; journalName: string }) {
    const { fname, journalName } = opts;
    const journalIndex = fname.indexOf(journalName);
    const normTitle = NoteUtils.genTitle(fname);
    if (journalIndex < 0) {
      return normTitle;
    }
    const maybeDatePortion = fname.slice(journalIndex + journalName.length + 1);
    if (maybeDatePortion.match(/\d\d\d\d\.\d\d\.\d\d$/)) {
      return maybeDatePortion.replace(/\./g, "-");
    }
    return normTitle;
  }

  static genTitle(fname: string): string {
    const titleFromBasename = DNodeUtils.basename(fname, true);
    // check if title is unchanged from default. if so, add default title
    if (_.toLower(fname) == fname) {
      fname = titleFromBasename.replace(/-/g, " ");
      // type definitions are wrong
      // @ts-ignore
      return title(fname) as string;
    }
    // if user customized title, return the title as user specified
    return titleFromBasename;
  }

  static getNotesByFname({
    fname,
    notes,
    vault,
  }: {
    fname: string;
    notes: NotePropsDict | NoteProps[];
    vault?: DVault;
  }): NoteProps[] {
    if (!_.isArray(notes)) {
      notes = _.values(notes);
    }
    const out = _.filter(notes, (ent) => {
      return (
        ent.fname.toLowerCase() === fname.toLowerCase() &&
        (vault ? ent.vault.fsPath === vault.fsPath : true)
      );
    });
    return out;
  }

  static getNoteByFnameV5({
    fname,
    notes,
    vault,
    wsRoot,
  }: {
    fname: string;
    notes: NotePropsDict | NoteProps[];
    vault: DVault;
    wsRoot: string;
  }): NoteProps | undefined {
    if (!_.isArray(notes)) {
      notes = _.values(notes);
    }
    const out = _.find(notes, (ent) => {
      return (
        ent.fname.toLowerCase() === fname.toLowerCase() &&
        VaultUtils.isEqual(vault, ent.vault, wsRoot)
      );
    });
    return out;
  }

  static getNoteOrThrow({
    fname,
    notes,
    vault,
    wsRoot,
  }: {
    fname: string;
    notes: NotePropsDict | NoteProps[];
    vault: DVault;
    wsRoot: string;
  }): NoteProps {
    if (!_.isArray(notes)) {
      notes = _.values(notes);
    }
    const out = _.find(notes, (ent) => {
      return (
        ent.fname.toLowerCase() === fname.toLowerCase() &&
        VaultUtils.isEqual(vault, ent.vault, wsRoot)
      );
    });
    if (!out) {
      throw new DendronError({ message: `note ${fname} not found` });
    }
    return out;
  }

  /**
   @deprecated
   */
  static getNoteByFname(
    fname: string,
    notes: NotePropsDict,
    opts?: { throwIfEmpty?: boolean; vault?: DVault }
  ): NoteProps | undefined {
    const _out = _.filter(_.values(notes), (ent) => {
      return ent.fname.toLowerCase() === fname.toLowerCase();
    });
    let out;
    if (_out.length > 1) {
      if (!opts?.vault) {
        throw new DendronError({
          message: `multiple nodes found and no vault given for ${fname}`,
        });
      }
      out = _.find(
        _out,
        (ent) => ent.vault.fsPath === opts?.vault?.fsPath
      ) as NoteProps;
      if (_.isUndefined(out)) {
        throw new DendronError({
          message: `no note found for vault: ${opts.vault.fsPath}`,
        });
      }
    } else {
      out = _out[0];
    }
    if (opts?.throwIfEmpty && _.isUndefined(out)) {
      throw Error(`${fname} not found in getNoteByFname`);
    }
    return out;
  }
  static getNotesWithLinkTo({
    note,
    notes,
  }: {
    note: NoteProps;
    notes: NotePropsDict;
  }): NoteProps[] {
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
    return _.reject(maybe, _.isUndefined) as NoteProps[];
  }

  static getFullPath({
    note,
    wsRoot,
  }: {
    note: NoteProps;
    wsRoot: string;
  }): string {
    try {
      const fpath = DNodeUtils.getFullPath({
        wsRoot,
        vault: note.vault,
        basename: note.fname + ".md",
      });
      return fpath;
    } catch (err) {
      throw new DendronError({
        message: "bad path",
        payload: { note, wsRoot },
      });
    }
  }

  static getURI({ note, wsRoot }: { note: NoteProps; wsRoot: string }): URI {
    return URI.file(this.getFullPath({ note, wsRoot }));
  }

  static getPathUpTo(hpath: string, numCompoenents: number) {
    return hpath.split(".").slice(0, numCompoenents).join(".");
  }

  static getRoots(notes: NotePropsDict): NoteProps[] {
    return _.filter(_.values(notes), DNodeUtils.isRoot);
  }

  // /** Reads the full note contents from the file, including the frontmatter. */
  // static async readFullNote(opts: {
  //   note: NoteProps;
  //   wsRoot: string;
  // }): Promise<string> {
  //   const notePath = this.getFullPath(opts);
  //   return await fs.readFile(notePath, { encoding: "utf8" });
  // }

  // /** Reads the full note contents from the file, including the frontmatter. */
  // static readFullNoteSync(opts: { note: NoteProps; wsRoot: string }): string {
  //   const notePath = this.getFullPath(opts);
  //   return fs.readFileSync(notePath, { encoding: "utf8" });
  // }

  /**
   * Add props from @param noteHydrated to @param noteRaw
   * @param param0
   * @returns
   */
  static hydrate({
    noteRaw,
    noteHydrated,
  }: {
    noteRaw: NoteProps;
    noteHydrated: NoteProps;
  }) {
    const hydrateProps = _.pick(noteHydrated, ["parent", "children"]);
    return { ...noteRaw, ...hydrateProps };
  }

  static match({ notePath, pattern }: { notePath: string; pattern: string }) {
    return minimatch(notePath, pattern);
  }

  static isDefaultTitle(props: NoteProps) {
    return props.title === NoteUtils.genTitle(props.fname);
  }

  static normalizeFname(nodePath: string) {
    // remove md extension
    const idx = nodePath.lastIndexOf(".md");
    if (idx > 0) {
      nodePath = nodePath.slice(0, idx);
    }
    return _.trim(nodePath);
  }

  static serializeMeta(props: NoteProps) {
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
    props: NoteProps,
    opts?: { writeHierarchy?: boolean }
  ): string {
    const body = props.body;
    let blacklist = ["parent", "children"];
    if (opts?.writeHierarchy) {
      blacklist = [];
    }
    const meta = _.omit(NoteUtils.serializeMeta(props), blacklist);
    return matter.stringify(body || "", meta);
  }

  static toLogObj(note: NoteProps) {
    const { fname, id, children, vault, parent } = note;
    return {
      fname,
      id,
      children,
      vault,
      parent,
    };
  }

  static toNoteLoc(note: NoteProps): DNoteLoc {
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

  static validate(noteProps: Partial<NoteProps>) {
    if (_.isUndefined(noteProps)) {
      return DendronError.createFromStatus({
        status: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
        message: "NoteProps is undefined",
      });
    }
    if (_.isUndefined(noteProps.vault)) {
      return DendronError.createFromStatus({
        status: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
        message: "note vault is undefined",
      });
    }
    return true;
  }
}

type SchemaMatchResult = {
  schemaModule: SchemaModuleProps;
  schema: SchemaProps;
  namespace: boolean;
  notePath: string;
};

export class SchemaUtils {
  static applyTemplate(opts: {
    template: SchemaTemplate;
    note: NoteProps;
    engine: DEngineClient;
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
    opts: (SchemaOpts | SchemaRaw) & { vault: DVault }
  ): SchemaProps {
    const schemaDataOpts: (keyof SchemaData)[] = [
      "namespace",
      "pattern",
      "template",
    ];
    const optsWithoutData = _.omit(opts, schemaDataOpts);
    const optsData = _.pick(opts, schemaDataOpts);
    const vault = opts.vault;
    return DNodeUtils.create({
      vault,
      ..._.defaults(optsWithoutData, {
        title: optsWithoutData.id,
        data: optsData,
        fname: "__empty",
      }),
      type: "schema",
    });
  }

  static createModule(opts: SchemaModuleOpts): SchemaModuleOpts {
    return opts;
  }

  static createModuleProps(opts: {
    fname: string;
    vault: DVault;
  }): SchemaModuleProps {
    const { fname, vault } = opts;
    const root = SchemaUtils.create({
      id: `${fname}`,
      fname,
      parent: "root",
      created: 1,
      updated: 1,
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
    opts: Partial<SchemaProps> & { vault: DVault }
  ): SchemaModuleOpts {
    const schema = SchemaUtils.create({
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
    opts?: Partial<SchemaProps>
  ): SchemaModuleProps {
    const schema = SchemaUtils.create({
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
    props: SchemaModuleProps;
    vaults: DVault[];
  }): DNodePropsQuickInputV2 {
    const vaultSuffix =
      vaults.length > 1
        ? ` (${path.basename(props.vault?.fsPath as string)})`
        : "";
    const label = DNodeUtils.isRoot(props.root) ? "root" : props.root.id;
    const detail = props.root.desc;
    const out = {
      ...props.root,
      fname: props.fname,
      label,
      detail,
      description: vaultSuffix,
      vault: props.vault,
    };
    return out;
  }

  static getModuleRoot(
    module: SchemaModuleOpts | SchemaModuleProps
  ): SchemaProps {
    const maybeRoot = _.find(module.schemas, { parent: "root" });
    if (!maybeRoot) {
      const rootSchemaRoot = _.find(module.schemas, {
        parent: null,
        id: "root",
      });
      if (!rootSchemaRoot) {
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.NO_ROOT_SCHEMA_FOUND,
        });
      } else {
        return rootSchemaRoot as SchemaProps;
      }
    }
    return maybeRoot as SchemaProps;
  }

  /**
   * If no pattern field, get the id.
   * If pattern field, check if namespace and translate into glob pattern
   * @param schema
   * @param opts
   * @returns
   */
  static getPattern = (
    schema: SchemaProps,
    opts?: { isNotNamespace?: boolean }
  ) => {
    const pattern = schema?.data?.pattern || schema.id;
    const part =
      schema?.data?.namespace && !opts?.isNotNamespace
        ? `${pattern}/*`
        : pattern;
    return part;
  };

  /**
   * Get full pattern starting from the root
   * @param schema
   * @param schemas
   * @returns
   */
  static getPatternRecursive = (
    schema: SchemaProps,
    schemas: SchemaPropsDict
  ): string => {
    const part = SchemaUtils.getPattern(schema);
    if (_.isNull(schema.parent)) {
      return part;
    }
    const parent: SchemaProps = schemas[schema.parent];
    if (parent && parent.id !== "root") {
      const prefix = SchemaUtils.getPatternRecursive(parent, schemas);
      return [prefix, part].join("/");
    } else {
      return part;
    }
  };

  /**
   * @param param0
   * @returns
   */
  static getPath({ root, fname }: { root: string; fname: string }): string {
    return path.join(root, fname + ".schema.yml");
  }

  /**
   @deprecated
   */
  static getSchemaModuleByFnameV4({
    fname,
    schemas,
    wsRoot,
    vault,
  }: {
    fname: string;
    schemas: SchemaModuleDict | SchemaModuleProps[];
    wsRoot: string;
    vault: DVault;
  }): SchemaModuleProps | undefined {
    if (!_.isArray(schemas)) {
      schemas = _.values(schemas);
    }
    const out = _.find(schemas, (ent) => {
      if (ent.fname.toLowerCase() !== fname.toLowerCase()) {
        return false;
      }
      if (vault) {
        return VaultUtils.isEqual(vault, ent.vault, wsRoot);
      }
      return true;
    });
    return out;
  }

  static getSchemaFromNote({
    note,
    engine,
  }: {
    note: NoteProps;
    engine: DEngineClient;
  }) {
    if (note.schema) {
      return engine.schemas[note.schema.moduleId];
    }
    return;
  }

  static hasSimplePattern = (
    schema: SchemaProps,
    opts?: { isNotNamespace?: boolean }
  ): boolean => {
    const pattern: string = SchemaUtils.getPattern(schema, opts);
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
    domain: NoteProps,
    notes: NotePropsDict,
    schemas: SchemaModuleDict
  ) {
    const match = schemas[domain.fname];
    if (!match) {
      return;
    } else {
      const domainSchema = match.schemas[match.root.id];
      return SchemaUtils.matchDomainWithSchema({
        noteCandidates: [domain],
        notes,
        schemaCandidates: [domainSchema],
        schemaModule: match,
      });
    }
  }

  static matchDomainWithSchema(opts: {
    noteCandidates: NoteProps[];
    notes: NotePropsDict;
    schemaCandidates: SchemaProps[];
    schemaModule: SchemaModuleProps;
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
      return SchemaUtils.matchNotePathWithSchemaAtLevel({
        notePath: note.fname,
        schemas: schemaCandidates,
        schemaModule,
        matchNamespace,
      });
    }).filter((ent) => !_.isUndefined(ent)) as SchemaMatchResult[];

    matches.map((m) => {
      const { schema, notePath } = m;
      const note = _.find(noteCandidates, { fname: notePath }) as NoteProps;
      NoteUtils.addSchema({ note, schema, schemaModule });

      const matchNextNamespace =
        schema.data.namespace && matchNamespace ? false : true;
      const nextSchemaCandidates = matchNextNamespace
        ? schema.children.map((id) => schemaModule.schemas[id])
        : [schema];

      const nextNoteCandidates = note.children.map((id) => notes[id]);
      return SchemaUtils.matchDomainWithSchema({
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
    schemaModDict: SchemaModuleDict;
  }): SchemaMatchResult | undefined {
    const { notePath, schemaModDict } = opts;
    const domainName = DNodeUtils.domainName(notePath);
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
      return SchemaUtils.matchPathWithSchema({
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
    schemaCandidates: SchemaProps[];
    schemaModule: SchemaModuleProps;
    matchNamespace?: boolean;
  }): SchemaMatchResult | undefined {
    const getChildOfPath = (notePath: string, matched: string) => {
      const nextLvlIndex = _.indexOf(notePath, ".", matched.length + 1);
      return nextLvlIndex > 0 ? notePath.slice(0, nextLvlIndex) : notePath;
    };

    const nextNotePath = getChildOfPath(notePath, matched);

    const match = SchemaUtils.matchNotePathWithSchemaAtLevel({
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
      return SchemaUtils.matchPathWithSchema({
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
    schemas: SchemaProps[];
    schemaModule: SchemaModuleProps;
    matchNamespace?: boolean;
  }): SchemaMatchResult | undefined {
    const notePathClean = notePath.replace(/\./g, "/");
    let namespace = false;
    let match = _.find(schemas, (sc) => {
      const pattern = SchemaUtils.getPatternRecursive(sc, schemaModule.schemas);
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

  static serializeSchemaProps(props: SchemaProps | SchemaOpts): SchemaRaw {
    const builtinProps: Omit<SchemaOpts, "fname" | "vault"> = _.pick(props, [
      "id",
      "children",
    ]);
    const optional: (keyof Omit<SchemaOpts, "fname" | "vault">)[] = [
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

  static serializeModuleProps(moduleProps: SchemaModuleProps) {
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
  static serializeModuleOpts(moduleOpts: SchemaModuleOpts) {
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
  //   noteOrPath: NoteProps| string,
  //   schemas: SchemaModuleV2[],
  //   opts?: { matchNamespace?: boolean; matchPrefix?: boolean }
  // ): SchemaProps {
  //   const cleanOpts = _.defaults(opts, {
  //     matchNamespace: true,
  //     matchPrefix: false,
  //   });
  //   const notePath = _.isString(noteOrPath) ? noteOrPath : noteOrPath.fname;
  //   const notePathClean = notePath.replace(/\./g, "/");
  //   let match: SchemaProps| undefined;
  //   _.find(schemas, (schemaMod) => {
  //     let schemasToMatch = schemaMod.schemas;
  //     return _.some(schemaDomain.nodes, (schema) => {
  //       const patternMatch = schema.patternMatch;
  //       if (
  //         (schema as SchemaProps).data.namespace &&
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
