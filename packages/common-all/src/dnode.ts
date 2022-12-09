/* eslint-disable no-throw-literal */
// @ts-ignore
import matter from "gray-matter";
import _ from "lodash";
import minimatch from "minimatch";
import path from "path";
import title from "title";
import { URI } from "vscode-uri";
import {
  CONSTANTS,
  ERROR_STATUS,
  InvalidFilenameReason,
  TAGS_HIERARCHY,
} from "./constants";
import { DendronError } from "./error";
import { NoteDictsUtils } from "./noteDictsUtils";
import { Time } from "./time";
import {
  DEngineClient,
  DNodeExplicitPropsEnum,
  DNodeImplicitPropsEnum,
  DNodeOpts,
  DNodeProps,
  DNodePropsQuickInputV2,
  DNoteLoc,
  NoteChangeEntry,
  NoteDicts,
  NoteLocalConfig,
  NoteOpts,
  NoteProps,
  NotePropsByIdDict,
  NotePropsMeta,
  NoteQuickInputV2,
  ReducedDEngine,
  RespV3,
  SchemaData,
  SchemaModuleDict,
  SchemaModuleOpts,
  SchemaModuleProps,
  SchemaOpts,
  SchemaProps,
  SchemaPropsDict,
  SchemaRaw,
} from "./types";
import { DVault } from "./types/DVault";
import {
  getSlugger,
  isNotUndefined,
  normalizeUnixPath,
  randomColor,
} from "./utils";
import { genUUID } from "./uuid";
import { VaultUtils } from "./vault";

import YAML, { JSON_SCHEMA } from "js-yaml";

export type ValidateFnameResp =
  | {
      isValid: false;
      reason: InvalidFilenameReason;
    }
  | {
      isValid: true;
      reason?: never;
    };

/**
 * Utilities for dealing with nodes
 */
export class DNodeUtils {
  static addChild(parent: NotePropsMeta, child: NotePropsMeta) {
    parent.children = Array.from(new Set(parent.children).add(child.id));
    child.parent = parent.id;
  }

  static removeChild(parent: NotePropsMeta, child: NotePropsMeta) {
    parent.children = _.reject(parent.children, (ent) => ent === child.id);
  }

  static create(opts: DNodeOpts): DNodeProps {
    const cleanProps: DNodeProps = _.defaults(opts, {
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
      title: opts.title || NoteUtils.genTitle(opts.fname),
    });

    // TODO: remove
    // don't include optional props
    const optionalProps: (keyof DNodeOpts)[] = [
      "stub",
      "schema",
      "schemaStub",
      "custom",
      "color",
      "tags",
      "image",
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
    //skip for nodePath that has a sub-hierarchy starting with .md eg: learn.mdone.test, learn.md-one.new
    if (rmExtension && nodePath.endsWith(".md")) {
      nodePath = nodePath.slice(undefined, -3);
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
    schema,
    vaults,
    wsRoot,
  }: {
    props: DNodeProps;
    schema?: SchemaModuleProps;
    vaults: DVault[];
    wsRoot: string;
  }): DNodePropsQuickInputV2 {
    const vault = VaultUtils.matchVault({ vaults, wsRoot, vault: props.vault });

    if (!vault) {
      throw Error("enhancePropForQuickInput, no vault found");
    }
    const vname = VaultUtils.getName(vault);
    // to ensure there is a space between the note title and vault name
    const vaultSuffix = ` (${vname})`;
    if (props.type === "note") {
      const isRoot = DNodeUtils.isRoot(props);
      const label = isRoot ? "root" : props.fname;
      const detail = props.desc;
      const description = NoteUtils.genSchemaDesc(props, schema) + vaultSuffix;
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
    vaults: DVault[];
    wsRoot: string;
    schema?: SchemaModuleProps;
    alwaysShow?: boolean;
  }): DNodePropsQuickInputV2 {
    const { alwaysShow } = _.defaults(opts, { alwaysShow: false });
    return { ...this.enhancePropForQuickInput(opts), alwaysShow };
  }

  /**
   * This version skips unnecessary parameters such as wsRoot and vaults to
   * simplify the ILookupProvider interface
   * @param opts
   * @returns
   */
  static enhancePropForQuickInputV4(opts: {
    props: NotePropsMeta;
    schema?: SchemaModuleProps;
    alwaysShow?: boolean;
  }): NoteQuickInputV2 {
    const { props, schema } = opts;
    const vname = VaultUtils.getName(opts.props.vault);
    const vaultSuffix = `(${vname})`;
    if (opts.props.type === "note") {
      const isRoot = DNodeUtils.isRoot(props);
      const label = isRoot ? "root" : props.fname;
      const detail = props.desc;
      const description = NoteUtils.genSchemaDesc(props, schema) + vaultSuffix;
      const out = { ...props, label, detail, description };
      return out;
    } else {
      const label = DNodeUtils.isRoot(props) ? "root" : props.id;
      const detail = props.desc;
      const out = { ...props, label, detail, description: vaultSuffix };
      return out;
    }
  }

  static findClosestParent(
    fpath: string,
    noteDicts: NoteDicts,
    opts: {
      noStubs?: boolean;
      vault: DVault;
    }
  ): NoteProps {
    const { vault } = opts;
    const dirname = DNodeUtils.dirName(fpath);
    if (dirname === "") {
      const _node = NoteDictsUtils.findByFname({
        fname: "root",
        noteDicts,
        vault,
      })[0];
      if (_.isUndefined(_node)) {
        throw new DendronError({ message: `no root found for ${fpath}` });
      }
      return _node;
    }
    const maybeNode = NoteDictsUtils.findByFname({
      fname: dirname,
      noteDicts,
      vault,
    })[0];
    if (
      (maybeNode && !opts?.noStubs) ||
      (maybeNode && opts?.noStubs && !maybeNode.stub && !maybeNode.schemaStub)
    ) {
      return maybeNode;
    } else {
      return DNodeUtils.findClosestParent(dirname, noteDicts, opts);
    }
  }

  static async findClosestParentWithEngine(
    fpath: string,
    engine: ReducedDEngine,
    opts: {
      excludeStub?: boolean;
      vault: DVault;
    }
  ): Promise<NotePropsMeta> {
    const { vault, excludeStub } = opts;
    const dirname = DNodeUtils.dirName(fpath);
    if (dirname === "") {
      const notes = await engine.findNotesMeta({ fname: "root", vault });
      if (notes.length === 0) {
        throw new DendronError({ message: `no root found for ${fpath}` });
      }
      return notes[0];
    }
    const maybeNotes = await engine.findNotesMeta({
      fname: dirname,
      vault,
      excludeStub,
    });
    if (maybeNotes.length > 0) {
      return maybeNotes[0];
    } else {
      return DNodeUtils.findClosestParentWithEngine(dirname, engine, opts);
    }
  }

  /**
   * Custom props are anything that is not a reserved key in Dendron
   * @param props
   * @returns
   */
  static getCustomProps(props: any): any {
    const blacklist = [
      ...Object.values(DNodeExplicitPropsEnum),
      ...Object.values(DNodeImplicitPropsEnum),
    ];
    return _.omit(props, blacklist);
  }

  static getDepth(node: NotePropsMeta): number {
    return this.getFNameDepth(node.fname);
  }

  static getFNameDepth(fname: string) {
    if (fname === "root") {
      return 0;
    }
    return fname.split(".").length;
  }

  static getFullPath(opts: {
    wsRoot: string;
    vault: DVault;
    basename: string;
  }) {
    const root = path.isAbsolute(opts.vault.fsPath)
      ? VaultUtils.getRelPath(opts.vault)
      : path.join(opts.wsRoot, VaultUtils.getRelPath(opts.vault));
    return path.join(root, opts.basename);
  }

  static isRoot(note: NotePropsMeta) {
    return note.fname === "root";
  }

  /**
   * Given a note, return the leaf name
   * @param note DNodeProps
   * @returns name of leaf node
   */
  static getLeafName(note: NotePropsMeta) {
    return _.split(note.fname, ".").pop();
  }
}

export class NoteUtils {
  /** Regular expression FrontMatter */
  static RE_FM = /^---(.*)^---/ms;

  /** Regular expression FrontMatter updated. */
  static RE_FM_UPDATED = /^updated:\s+(\d+)$/m;

  /** Regular expression FrontMatter created. */
  static RE_FM_CREATED = /^created:.*$/m;

  /** Regular expression FrontMatter updated or created.  */
  static RE_FM_UPDATED_OR_CREATED =
    /^(?<beforeTimestamp>(updated|created): *)(?<timestamp>[0-9]+)$/;

  static getNoteTraits(note: NotePropsMeta): string[] {
    return _.get(note, "traitIds", []);
  }

  /**
   * Add node to parents up the note tree, or create stubs if no direct parents exists
   *
   * @param opts
   * @returns All parent notes that were changed
   */
  static addOrUpdateParents(opts: {
    note: NoteProps;
    noteDicts: NoteDicts;
    createStubs: boolean;
  }): NoteChangeEntry[] {
    const { note, noteDicts, createStubs } = opts;
    const changed: NoteChangeEntry[] = [];

    // Ignore if root note
    if (DNodeUtils.isRoot(note)) {
      return changed;
    }
    const parentPath = DNodeUtils.dirName(note.fname).toLowerCase();
    const parent = NoteDictsUtils.findByFname({
      fname: parentPath,
      noteDicts,
      vault: note.vault,
    })[0];

    if (parent) {
      const prevParentState = { ...parent };
      DNodeUtils.addChild(parent, note);
      changed.push({
        status: "update",
        prevNote: prevParentState,
        note: parent,
      });
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
      const ancestor = DNodeUtils.findClosestParent(note.fname, noteDicts, {
        vault: note.vault,
      });

      const prevAncestorState = { ...ancestor };

      const stubNodes = NoteUtils.createStubs(ancestor, note);
      stubNodes.forEach((stub) => {
        changed.push({
          status: "create",
          note: stub,
        });
      });

      changed.push({
        status: "update",
        prevNote: prevAncestorState,
        note: ancestor,
      });
    }
    return changed;
  }

  static addSchema(opts: {
    note: NotePropsMeta;
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

  static async createWithSchema({
    noteOpts,
    engine,
  }: {
    noteOpts: NoteOpts;
    engine: DEngineClient;
  }): Promise<NoteProps> {
    const note = NoteUtils.create(noteOpts);
    const maybeMatch = await SchemaUtils.matchPath({
      notePath: noteOpts.fname,
      engine,
    });
    if (maybeMatch) {
      const { schema, schemaModule } = maybeMatch;
      NoteUtils.addSchema({ note, schemaModule, schema });
    }
    return note;
  }

  /**
   * Given a stub note, update it so that it has a schema applied to it
   * This is done before the stub note is accepted as a new item
   * and saved to the store
   */
  static async updateStubWithSchema(opts: {
    stubNote: NoteProps;
    engine: DEngineClient;
  }): Promise<NoteProps> {
    const { stubNote, engine } = opts;
    const cleanStubNote = _.omit(stubNote, "stub");
    const schemaMatch = await SchemaUtils.matchPath({
      notePath: cleanStubNote.fname,
      engine,
    });
    if (schemaMatch) {
      const { schema, schemaModule } = schemaMatch;
      NoteUtils.addSchema({ note: cleanStubNote, schemaModule, schema });
    }
    return cleanStubNote;
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

  /**
   * Create a wiki link to the given note
   *
   * @returns
   */
  static createWikiLink(opts: {
    note: NotePropsMeta;
    anchor?: {
      value: string;
      type: "header" | "blockAnchor";
    };
    alias?: {
      mode: "snippet" | "title" | "value" | "none";
      value?: string;
      tabStopIndex?: number;
    };
    useVaultPrefix?: boolean;
  }): string {
    const { note, anchor, useVaultPrefix, alias } = opts;
    const aliasMode = alias?.mode;
    const aliasValue = alias?.value;
    const tabStopIndex = alias?.tabStopIndex;
    const { fname, vault } = note;
    let title = note.title;

    if (note.fname.startsWith(TAGS_HIERARCHY)) {
      const tag = note.fname.split(TAGS_HIERARCHY)[1];
      return `#${tag}`;
    }

    let suffix = "";
    if (anchor) {
      const { value: id, type } = anchor;
      let idStr;
      if (type === "header") {
        title = id;
        idStr = getSlugger().slug(id);
      } else {
        idStr = id;
      }
      suffix = `#${idStr}`;
    }
    const vaultPrefix = useVaultPrefix
      ? `${CONSTANTS.DENDRON_DELIMETER}${VaultUtils.getName(vault)}/`
      : "";

    let aliasPrefix = "";

    switch (aliasMode) {
      case "snippet": {
        aliasPrefix = `\${${tabStopIndex}:alias}|`;
        break;
      }
      case "title": {
        aliasPrefix = `${title}|`;
        break;
      }
      case "value": {
        aliasPrefix = aliasValue !== "" ? `${aliasValue}|` : "";
        break;
      }
      default:
        break;
    }
    const link = `[[${aliasPrefix}${vaultPrefix}${fname}${suffix}]]`;
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

  static genSchemaDesc(
    note: NotePropsMeta,
    schemaMod?: SchemaModuleProps
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

        if (schema.data.isIdAutoGenerated) {
          if (schema.title !== schema.id) {
            // Id was omitted but a manual title was provided in the schema so
            // hence we prefer the title over a pattern.
            prefixParts.push(schema.title);
          } else {
            // We know id is a jumble of random characters now, and title of schema
            // must have defaulted to id, hence our best bet is to use a pattern which
            // must always be set if the id is generated.
            prefixParts.push(schema.data.pattern);
          }
        } else {
          prefixParts.push(schema.title || schema.id);
        }
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

  static updateNoteLocalConfig<K extends keyof NoteLocalConfig>(
    note: NoteProps,
    key: K,
    config: Partial<NoteLocalConfig[K]>
  ) {
    if (!note.config) {
      note.config = {};
    }
    if (!note.config[key]) {
      note.config[key] = config;
    } else {
      _.merge(note.config[key], config);
    }
    return note;
  }

  static genTitle(fname: string): string {
    const titleFromBasename = DNodeUtils.basename(fname, true);
    // check if title is unchanged from default. if so, add default title
    if (_.toLower(fname) === fname) {
      fname = titleFromBasename.replace(/-/g, " ");
      return title(fname);
    }
    // if user customized title, return the title as user specified
    return titleFromBasename;
  }

  static genTitleFromFullFname(fname: string): string {
    const formatted = fname.replace(/\./g, " ");
    return title(formatted);
  }

  static getNotesWithLinkTo({
    note,
    notes,
  }: {
    note: NotePropsMeta;
    notes: NotePropsMeta[];
  }): NotePropsMeta[] {
    const maybe = notes.map((ent) => {
      if (
        _.find(ent.links, (l) => {
          return l.to?.fname?.toLowerCase() === note.fname.toLowerCase();
        })
      ) {
        return ent;
      } else {
        return;
      }
    });
    return _.reject(maybe, _.isUndefined) as NotePropsMeta[];
  }

  static getFullPath({
    note,
    wsRoot,
  }: {
    note: NotePropsMeta;
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

  static getURI({
    note,
    wsRoot,
  }: {
    note: NotePropsMeta;
    wsRoot: string;
  }): URI {
    return URI.file(this.getFullPath({ note, wsRoot }));
  }
  /**
   * Get a list that has all the parents of the current note with the current note
   */
  static getNoteWithParents({
    note,
    notes,
    sortDesc = true,
  }: {
    note: NoteProps;
    notes: NotePropsByIdDict;
    sortDesc?: boolean;
  }): NoteProps[] {
    const out = [];
    if (!note || _.isUndefined(note)) {
      return [];
    }
    while (note.parent !== null) {
      out.push(note);
      try {
        const tmp = notes[note.parent];
        if (_.isUndefined(tmp)) {
          throw "note is undefined";
        }
        note = tmp;
      } catch (err) {
        throw Error(`no parent found for note ${note.id}`);
      }
    }
    out.push(note);
    if (sortDesc) {
      _.reverse(out);
    }
    return out;
  }

  static getPathUpTo(hpath: string, numCompoenents: number) {
    return hpath.split(".").slice(0, numCompoenents).join(".");
  }

  static getRoots(notes: NotePropsByIdDict): NoteProps[] {
    return _.filter(_.values(notes), DNodeUtils.isRoot);
  }

  /**
   * Add derived metadata from `noteHydrated` to `noteRaw`
   * By default, include the following properties:
   *  - parent
   *  - children
   * @param noteRaw - note for other fields
   * @param noteHydrated - note to get metadata properties from
   * @returns Merged Note object
   */
  static hydrate({
    noteRaw,
    noteHydrated,
    opts,
  }: {
    noteRaw: NoteProps;
    noteHydrated: NotePropsMeta;
    opts?: Partial<{
      keepBackLinks: boolean;
    }>;
  }) {
    const hydrateProps = _.pick(noteHydrated, ["parent", "children"]);

    // check if we hydrate with links
    if (opts?.keepBackLinks) {
      noteRaw.links = noteHydrated.links.filter(
        (link) => link.type === "backlink"
      );
    }

    return { ...noteRaw, ...hydrateProps };
  }

  static match({ notePath, pattern }: { notePath: string; pattern: string }) {
    return minimatch(notePath, pattern);
  }

  static isDefaultTitle(props: NotePropsMeta) {
    return props.title === NoteUtils.genTitle(props.fname);
  }

  /**
   * Remove `.md` extension if exists and remove spaces
   * @param nodePath
   * @returns
   */
  static normalizeFname(nodePath: string) {
    nodePath = _.trim(nodePath);
    if (nodePath.endsWith(".md")) {
      //removing .md extenion from the end.
      //Can be sliced with undefined, 0 or the negative index from the end.
      nodePath = nodePath.slice(undefined, -3);
    }
    return nodePath;
  }

  static isNoteProps(props: Partial<NoteProps>): props is NoteProps {
    const REQUIRED_DNODEPROPS: (keyof DNodeProps)[] = [
      "id",
      "title",
      "desc",
      "links",
      "anchors",
      "fname",
      "type",
      "updated",
      "created",
      "parent",
      "children",
      "data",
      "body",
      "vault",
    ];
    return (
      _.isObject(props) &&
      REQUIRED_DNODEPROPS.every(
        (key) => key in props && isNotUndefined(props[key])
      )
    );
  }

  static serializeExplicitProps(props: NoteProps): Partial<NoteProps> {
    // Remove all undefined values, because they cause `matter` to fail serializing them
    const cleanProps: Partial<NoteProps> = Object.fromEntries(
      Object.entries(props).filter(([_k, v]) => isNotUndefined(v))
    );
    if (!this.isNoteProps(cleanProps))
      throw new DendronError({
        message: `Note is missing some properties that are required. Found properties: ${JSON.stringify(
          props
        )}`,
      });

    let propsWithTrait: NoteProps & { traitIds?: string[] } = { ...cleanProps };

    if (cleanProps.traits) {
      propsWithTrait = {
        ...cleanProps,
        traitIds: cleanProps.traits.map((value) => value),
      };
    }

    // Separate custom and builtin props
    const builtinProps = _.pick(propsWithTrait, [
      ...Object.values(DNodeExplicitPropsEnum),
    ]);

    const { custom: customProps } = cleanProps;
    const meta = { ...builtinProps, ...customProps };
    return meta;
  }

  static serialize(props: NoteProps): string {
    const body = props.body;
    const blacklist = ["parent", "children", "stub"];
    const meta = _.omit(NoteUtils.serializeExplicitProps(props), blacklist);
    // Make sure title and ID are always strings
    meta.title = _.toString(meta.title);
    meta.id = _.toString(meta.id);

    const stringified = matter.stringify(body || "", meta);
    // Stringify appends \n if it doesn't exist. Remove it if body originally doesn't contain new line
    return body.slice(-1) !== "\n" ? stringified.slice(0, -1) : stringified;
  }

  static toLogObj(note: NotePropsMeta) {
    const { fname, id, children, vault, parent } = note;
    return {
      fname,
      id,
      children,
      vault,
      parent,
    };
  }

  static toNoteLoc(note: NotePropsMeta): DNoteLoc {
    const { fname, id, vault } = note;
    return {
      fname,
      id,
      vaultName: VaultUtils.getName(vault),
    };
  }

  /**
   * Human readable note location. eg: `dendron://foo (uisdfsdfsdf)`
   */
  static toNoteLocString(note: NotePropsMeta): string {
    const noteLoc = this.toNoteLoc(note);
    const out: string[] = [];
    if (noteLoc.vaultName) {
      out.push(`dendron://${noteLoc.vaultName}/`);
    }
    out.push(noteLoc.fname);
    if (noteLoc.id) {
      out.push(` (${noteLoc.id})`);
    }
    return out.join("");
  }

  static uri2Fname(uri: URI) {
    return path.basename(uri.fsPath, ".md");
  }

  /**
   * Check if input is a valid note
   * @param maybeNoteProps
   * @returns
   */
  static validate(maybeNoteProps: any): RespV3<boolean> {
    if (_.isUndefined(maybeNoteProps)) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
          message: "NoteProps is undefined",
        }),
      };
    }
    if (_.isUndefined(maybeNoteProps.vault)) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
          message: "note vault is undefined",
        }),
      };
    }
    if (!_.isString(maybeNoteProps.title)) {
      return {
        error: DendronError.createFromStatus({
          status: ERROR_STATUS.BAD_PARSE_FOR_NOTE,
          message: "note title not set as string",
        }),
      };
    }
    return { data: true };
  }

  /**
   * Given a filename, return the validity of the filename.
   * If invalid, a reason string is also returned.
   * Only the first encountered reason will be reported.
   * @param fname filename
   * @returns boolean value representing the validity of the filename, and the reason if invalid
   */
  static validateFname(fname: string): ValidateFnameResp {
    // Each hierarchy string
    // 1. should not be empty
    // 2. should not have leading trailing whitespace
    for (const value of fname.split(".")) {
      const isEmpty = value === "";
      if (isEmpty) {
        return {
          isValid: false,
          reason: InvalidFilenameReason.EMPTY_HIERARCHY,
        };
      }
      const hasLeadingOrTrailingWhitespace =
        value.startsWith(" ") || value.endsWith(" ");
      if (hasLeadingOrTrailingWhitespace) {
        return {
          isValid: false,
          reason: InvalidFilenameReason.LEADING_OR_TRAILING_WHITESPACE,
        };
      }
    }

    // should not contain characters that SQLite doesn't allow
    const matcher = /[(),']/;
    const isSQLiteLegal = _.isNull(fname.match(matcher));
    if (!isSQLiteLegal) {
      return {
        isValid: false,
        reason: InvalidFilenameReason.ILLEGAL_CHARACTER,
      };
    }

    return { isValid: true };
  }

  /**
   * Given a file name, clean it so that it is valid
   * as per {@link NoteUtils.validateFname}
   * Optionally pass in the replace string that is used to replace
   * the illegal characters
   */
  static cleanFname(opts: { fname: string; replaceWith?: string }) {
    const { fname, replaceWith } = opts;
    // replace illegal strings before cleaning up hierarchy strings
    const fnameAfterReplace = fname.replace(
      /[(),'']/g,
      replaceWith === undefined ? " " : replaceWith
    );
    const hierarchies = fnameAfterReplace.split(".");
    const cleanedFname = hierarchies
      // trim leading / trailing whitespace
      .map((value) => {
        return _.trim(value, " ");
      })
      // cut out empty hierarchies
      .filter((value) => value !== "")
      .join(".");
    return cleanedFname;
  }

  /** Generate a random color for `note`, but allow the user to override that color selection.
   *
   * @param fname The fname of note that you want to get the color of.
   * @returns The color, and whether this color was randomly generated or explicitly defined.
   */
  static color(opts: { fname: string; vault?: DVault; note?: NotePropsMeta }): {
    color: string;
    type: "configured" | "generated";
  } {
    const { fname, note } = opts;
    // TODO: Re-enable the ancestor color logic later
    // const ancestors = NoteUtils.ancestors({ ...opts, includeSelf: true });
    // for (const note of ancestors) {
    //   if (note.color) return { color: note.color, type: "configured" };
    // }
    if (note && note.color) {
      return { color: note.color, type: "configured" };
    }
    return { color: randomColor(fname), type: "generated" };
  }

  /** Get the ancestors of a note, in the order of the closest to farthest.
   *
   * This function will continue searching for ancestors even if a note with `fname`
   * doesn't exist, provided that it has ancestors.
   * For example, if fname is `foo.bar.baz` but only `foo` exists, this function
   * will find `foo`.
   *
   * ```ts
   * const ancestorNotes = NoteUtils.ancestors({ fname });
   * for (const ancestor of ancestorNotes) { }
   * // or
   * const allAncestors = [...ancestorNotes];
   * ```
   *
   * @param opts.fname The fname of the note you are trying to get the ancestors of.
   * @param opts.vault The vault to look for. If provided, only notes from this vault will be included.
   * @param opts.engine The engine.
   * @param opts.includeSelf: If true, note with `fname` itself will be included in the ancestors.
   * @param opts.nonStubOnly: If true, only notes that are not stubs will be included.
   */
  static async ancestors(opts: {
    fname: string;
    vault?: DVault;
    engine: DEngineClient;
    includeSelf?: boolean;
    nonStubOnly?: boolean;
  }): Promise<NotePropsMeta | undefined> {
    const { fname, engine, includeSelf, nonStubOnly } = opts;
    let { vault } = opts;
    let parts = fname.split(".");
    let note: NotePropsMeta | undefined = (
      await engine.findNotesMeta({
        fname,
        vault,
      })
    )[0];

    // Check if we need this note itself
    if (note && includeSelf && !(nonStubOnly && note.stub)) return note;
    if (fname === "root") return;

    // All ancestors within the same hierarchy
    while (parts.length > 1) {
      parts = parts.slice(undefined, parts.length - 1);
      // eslint-disable-next-line no-await-in-loop
      note = (await engine.findNotesMeta({ fname: parts.join("."), vault }))[0];
      if (note && !(nonStubOnly && note.stub)) return note;
    }

    // The ultimate ancestor of all notes is root
    if (note) {
      // Yielded at least one note
      if (!vault) vault = note.vault;
      note = (await engine.findNotesMeta({ fname: "root", vault }))[0];
      return note;
    }
    return;
  }

  static isNote(uri: URI) {
    return uri.fsPath.endsWith(".md");
  }

  static FILE_ID_PREFIX = "file-";

  /** This should be only used for files not in Dendron workspace, for example a markdown file that's not in any vault. */
  static genIdForFile({
    filePath,
    wsRoot,
  }: {
    filePath: string;
    wsRoot: string;
  }): string {
    // Regardless of platform, use POSIX style
    const normalizedPath = normalizeUnixPath(path.relative(wsRoot, filePath));
    return `${this.FILE_ID_PREFIX}${normalizedPath}`;
  }

  /** Returns true if this is a note id generated by {@link NoteUtils.genIdForFile} */
  static isFileId(id: string) {
    return id.startsWith(this.FILE_ID_PREFIX);
  }

  /** This should be only used for files not in Dendron workspace, for example a markdown file that's not in any vault. */
  static createForFile(opts: {
    filePath: string;
    contents: string;
    wsRoot: string;
  }) {
    const id = this.genIdForFile(opts);
    return this.create({
      fname: path.basename(opts.filePath),
      id,
      vault: VaultUtils.createForFile(opts),
      body: opts.contents,
    });
  }

  static FAKE_ID_PREFIX = "fake-";

  /** Create a fake note object for something that is not actually a note in the workspace.
   *
   * For example when we need to render a piece of an actual note. If you need
   * to create a fake note for an actual file, prefer
   * {@link NoteUtils.createForFile} instead.
   */
  static createForFake(opts: {
    contents: string;
    fname: string;
    id: string;
    vault: DVault;
  }) {
    return this.create({
      fname: opts.fname,
      id: `${this.FAKE_ID_PREFIX}${opts.id}`,
      vault: opts.vault,
      body: opts.contents,
    });
  }
}

type SchemaMatchResult = {
  schemaModule: SchemaModuleProps;
  schema: SchemaProps;
  namespace: boolean;
  notePath: string;
};

export class SchemaUtils {
  static createFromSchemaRaw(opts: SchemaRaw & { vault: DVault }): SchemaProps {
    const schemaDataOpts: (keyof SchemaData)[] = [
      "namespace",
      "pattern",
      "template",
    ];
    const optsWithoutData = _.omit(opts, schemaDataOpts);
    const optsData = _.pick(opts, schemaDataOpts);

    this.processUntypedTemplate(optsData);

    const node = DNodeUtils.create({
      ..._.defaults(optsWithoutData, {
        title: optsWithoutData.id,
        data: optsData,
        fname: "__empty",
      }),
      type: "schema",
    });

    if (opts.isIdAutoGenerated) {
      node.data.isIdAutoGenerated = true;
    }

    return node;
  }

  static createFromSchemaOpts(
    opts: SchemaOpts & { vault: DVault }
  ): SchemaProps {
    const schemaDataOpts: (keyof SchemaData)[] = [
      "namespace",
      "pattern",
      "template",
    ];
    const optsWithoutData = _.omit(opts, schemaDataOpts);
    const optsData = _.pick(opts, schemaDataOpts);

    this.processUntypedTemplate(optsData);

    const vault = opts.vault;
    const node = DNodeUtils.create({
      vault,
      ..._.defaults(optsWithoutData, {
        title: optsWithoutData.id,
        data: optsData,
        fname: "__empty",
      }),
      type: "schema",
    });

    if (opts.data?.isIdAutoGenerated) {
      node.data.isIdAutoGenerated = true;
    }

    return node;
  }

  private static processUntypedTemplate(optsData: any) {
    // Standard templates have the format of
    //  `template: {id:'', type:''}`
    //
    // However we also want to support shorthand for declaring templates when just
    // the id of the template is specified with the format of
    //  `template: ''`
    if (_.isString(optsData.template)) {
      const typedTemplate = {
        id: optsData.template,
        type: "note",
      };

      optsData.template = typedTemplate;
    }
  }

  static createModule(opts: SchemaModuleOpts): SchemaModuleOpts {
    return opts;
  }

  static createModuleProps(opts: {
    fname: string;
    vault: DVault;
  }): SchemaModuleProps {
    const { fname, vault } = opts;
    const root = SchemaUtils.createFromSchemaOpts({
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
    const schema = SchemaUtils.createFromSchemaOpts({
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
    const schema = SchemaUtils.createFromSchemaOpts({
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

  static async doesSchemaExist({
    id,
    engine,
  }: {
    id: string;
    engine: DEngineClient;
  }) {
    const resp = await engine.getSchema(id);
    return !_.isUndefined(resp.data);
  }

  static async getSchemaFromNote({
    note,
    engine,
  }: {
    note: NotePropsMeta;
    engine: DEngineClient;
  }) {
    if (note.schema) {
      return (await engine.getSchema(note.schema.moduleId)).data;
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
   * Match and assign schemas to all nodes within a domain. Note - only use this
   * during engine init where SchemaModuleDict is available.
   *
   * @param domain
   * @param notes
   * @param schemas
   */
  static matchDomain(
    domain: NoteProps,
    notes: NotePropsByIdDict,
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
    notes: NotePropsByIdDict;
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

      const matchNextNamespace = !(schema.data.namespace && matchNamespace);
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

  //  ^dtaatxvjb4s3
  static async matchPath(opts: {
    notePath: string;
    engine: DEngineClient; //
  }): Promise<SchemaMatchResult | undefined> {
    const { notePath } = opts;
    const domainName = DNodeUtils.domainName(notePath);
    const resp = await opts.engine.getSchema(domainName);
    if (!resp.data) {
      return;
    } else {
      const domainSchema = resp.data.schemas[resp.data.root.id];
      if (domainName.length === notePath.length) {
        return {
          schema: domainSchema,
          notePath,
          namespace: domainSchema.data.namespace || false,
          schemaModule: resp.data,
        };
      }
      return SchemaUtils.matchPathWithSchema({
        notePath,
        matched: "",
        schemaCandidates: [domainSchema],
        schemaModule: resp.data,
      });
    }
  }

  /**
   * Find proper schema from schema module that can be applied to note
   */
  static findSchemaFromModule(opts: {
    notePath: string;
    schemaModule: SchemaModuleProps;
  }): SchemaMatchResult | undefined {
    const { notePath, schemaModule } = opts;
    const domainName = DNodeUtils.domainName(notePath);
    const domainSchema = schemaModule.schemas[schemaModule.root.id];
    if (domainName.length === notePath.length) {
      return {
        schema: domainSchema,
        notePath,
        namespace: domainSchema.data.namespace || false,
        schemaModule,
      };
    }
    return SchemaUtils.matchPathWithSchema({
      notePath,
      matched: "",
      schemaCandidates: [domainSchema],
      schemaModule,
    });
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
      const matchNextNamespace = !(schema.data.namespace && matchNamespace);

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
    const match = _.find(schemas, (sc) => {
      const pattern = SchemaUtils.getPatternRecursive(sc, schemaModule.schemas);
      if (sc?.data?.namespace && matchNamespace) {
        namespace = true;
        // current note is at the level of the namespace node.
        // the glob pattern accounts for its immediate children (/*/*),
        // so in order to match the current note, we should slice off
        // the last bit of the glob pattern (/*)
        return minimatch(notePathClean, pattern.slice(0, -2));
      } else {
        // we are either trying to match the immediate child of a namespace node,
        // or match a non-namespace regular schema. use the pattern as-is
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

  static isSchemaUri(uri: URI) {
    return uri.fsPath.endsWith(".schema.yml");
  }

  static serializeModuleProps(moduleProps: SchemaModuleProps) {
    const { version, imports, schemas } = moduleProps;
    // TODO: filter out imported schemas
    const out: any = {
      version,
      imports: [],
      schemas: _.values(schemas).map((ent) =>
        SchemaUtils.serializeSchemaProps(ent)
      ),
    };
    if (imports) {
      out.imports = imports;
    }
    return YAML.dump(out, { schema: JSON_SCHEMA });
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
