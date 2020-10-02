import {
  DendronError,
  DEngineInitPayloadV2,
  DNodePropsV2,
  DNodeUtilsV2,
  DStoreV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  ENGINE_ERROR_CODES,
  NoteOptsV2,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaModuleV2,
  SchemaOptsV2,
  SchemaPropsDictV2,
  SchemaPropsV2,
  SchemaUtils,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import {
  DLogger,
  file2Note,
  getAllFiles,
  globMatch,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import { FileMeta } from "packages/engine-server/lib";
import path from "path";
import YAML from "yamljs";

type FileMetaV2 = {
  // file name: eg. foo.md, name = foo
  prefix: string;
  // fpath: full path, eg: foo.md, fpath: foo.md
  fpath: string;
};
type FileMetaDictV2 = { [key: string]: FileMetaV2[] };

function getFileMetaV2(fpaths: string[]): FileMetaDictV2 {
  const metaDict: FileMetaDictV2 = {};
  _.forEach(fpaths, (fpath) => {
    const { name } = path.parse(fpath);
    const lvl = name.split(".").length;
    if (!_.has(metaDict, lvl)) {
      metaDict[lvl] = [];
    }
    metaDict[lvl].push({ prefix: name, fpath });
  });
  return metaDict;
}

export class ParserBaseV2 {
  constructor(public opts: { store: DStoreV2; logger: DLogger }) {}

  get logger() {
    return this.opts.logger;
  }
}

export class NoteParserV2 extends ParserBaseV2 {
  public cache: NotePropsCacheV2;

  constructor(
    public opts: { store: DStoreV2; cache: NotePropsCacheV2; logger: DLogger }
  ) {
    super(opts);
    this.cache = opts.cache;
  }

  parseFile(fpath: string[]): NotePropsV2[] {
    const fileMetaDict: FileMetaDictV2 = getFileMetaV2(fpath);
    const maxLvl = _.max(_.keys(fileMetaDict).map((e) => _.toInteger(e))) || 2;
    const notesByFname: NotePropsDictV2 = {};

    // get root note
    if (_.isUndefined(fileMetaDict[1])) {
      throw new DendronError({ status: ENGINE_ERROR_CODES.NO_ROOT_NOTE_FOUND });
    }
    const rootFile = fileMetaDict[1].find(
      (n) => n.fpath === "root.md"
    ) as FileMetaV2;
    if (!rootFile) {
      throw new DendronError({ status: ENGINE_ERROR_CODES.NO_ROOT_NOTE_FOUND });
    }
    const rootNote = this.parseNoteProps({
      fileMeta: rootFile,
      addParent: false,
    })[0];

    notesByFname[rootNote.fname] = rootNote;

    // get root of hiearchies
    let lvl = 2;
    let prevNodes: NotePropsV2[] = fileMetaDict[1]
      // don't count root node
      .filter((n) => n.fpath !== "root.md")
      .flatMap((ent) => {
        const notes = this.parseNoteProps({ fileMeta: ent, addParent: false });
        return notes;
      });
    prevNodes.forEach((ent) => {
      DNodeUtilsV2.addChild(rootNote, ent);
      notesByFname[ent.fname] = ent;
    });

    // get everything else
    while (lvl <= maxLvl) {
      const currNodes: NotePropsV2[] = (fileMetaDict[lvl] || [])
        .filter((ent) => {
          return !globMatch(["root.*"], ent.fpath);
        })
        .flatMap((ent) => {
          const node = this.parseNoteProps({
            fileMeta: ent,
            parents: prevNodes,
            notesByFname,
            addParent: true,
          });
          return node;
        });
      lvl += 1;
      currNodes.forEach((ent) => {
        notesByFname[ent.fname] = ent;
      });
      prevNodes = currNodes;
    }

    return _.values(notesByFname);
  }

  parseNoteProps(opts: {
    fileMeta: FileMetaV2;
    notesByFname?: NotePropsDictV2;
    parents?: NotePropsV2[];
    addParent: boolean;
    createStubs?: boolean;
  }): NotePropsV2[] {
    const cleanOpts = _.defaults(opts, {
      addParent: true,
      createStubs: true,
      notesByFname: {},
    });
    const ctx = "parseNoteProps";
    const root = this.opts.store.vaults[0];
    const { fileMeta, parents, notesByFname } = cleanOpts;
    let out: NotePropsV2[] = [];
    let noteProps: NotePropsV2;
    try {
      noteProps = file2Note(path.join(root, fileMeta.fpath));
    } catch (_err) {
      const err = {
        status: ENGINE_ERROR_CODES.BAD_PARSE_FOR_NOTE,
        msg: JSON.stringify({
          fname: fileMeta.fpath,
          error: _err.message,
        }),
      };
      this.logger.error({ ctx, fileMeta, err });
      throw new DendronError(err);
    }

    if (cleanOpts.addParent) {
      const parentPath = DNodeUtilsV2.dirName(fileMeta.prefix);
      let parent = _.find(parents, (p) => p.fname === parentPath) || null;

      if (!parent && !cleanOpts.createStubs) {
        const err = {
          status: ENGINE_ERROR_CODES.NO_PARENT_FOR_NOTE,
          msg: JSON.stringify({
            fname: fileMeta.fpath,
          }),
        };
        this.logger.error({ ctx, fileMeta, err });
        throw new DendronError(err);
      }
      if (!parent) {
        parent = DNodeUtilsV2.findClosestParent(
          noteProps.fname,
          notesByFname
        ) as NotePropsV2;
        const stubNodes = NoteUtilsV2.createStubs(parent, noteProps);
        stubNodes.forEach((ent2) => {
          out.push(ent2);
        });
      }
      DNodeUtilsV2.addChild(parent, noteProps);
    }
    out.push(noteProps);
    return out;
  }

  parse(fpaths: string[]): NotePropsV2[] {
    return this.parseFile(fpaths);
  }
}

export class SchemaParserV2 extends ParserBaseV2 {
  static parseFile(fpath: string, root: string): SchemaModuleV2 {
    const fname = path.parse(fpath).name;
    const schemaOpts: any = YAML.parse(
      fs.readFileSync(path.join(root, fpath), "utf8")
    );
    const version = _.isArray(schemaOpts) ? 0 : 1;
    if (version > 0) {
      return SchemaParserV2.parseSchemaModuleProps(
        schemaOpts as SchemaModulePropsV2,
        {
          fname,
          root,
        }
      );
    } else {
      const schemaDict: SchemaPropsDictV2 = {};
      (schemaOpts as SchemaOptsV2[]).map((ent) => {
        const schema = SchemaUtilsV2.create(ent);
        schemaDict[schema.id] = schema;
      });
      const maybeRoot = schemaDict["root"] as SchemaPropsV2;
      return {
        root: maybeRoot,
        schemas: schemaDict,
        fname: maybeRoot.fname,
      };
    }
  }

  static parseSchemaModuleProps(
    schemaModuleProps: SchemaModulePropsV2,
    opts: { fname: string; root: string }
  ): SchemaModuleV2 {
    const { imports, schemas } = schemaModuleProps;
    const { fname, root } = opts;
    let schemaModulesFromImport = _.flatMap(imports, (ent) => {
      return SchemaParserV2.parseFile(`${ent}.yml`, root);
    });
    const schemaPropsFromImport = schemaModulesFromImport.flatMap((mod) => {
      return _.values(mod.schemas).map((ent) => {
        const domain = SchemaUtils.fname(ent.fname);
        ent.data.pattern = ent.data.pattern || ent.id;
        ent.id = `${domain}.${ent.id}`;
        ent.fname = fname;
        ent.parent = null;
        ent.children = ent.children.map((ent) => `${domain}.${ent}`);
        return ent;
      });
    });
    const schemaPropsFromFile = schemas.map((ent) => {
      return SchemaUtilsV2.create(ent);
    });
    const schemasAll = schemaPropsFromImport.concat(schemaPropsFromFile);

    const schemasDict: SchemaPropsDictV2 = {};
    schemasAll.forEach((ent) => {
      schemasDict[ent.id] = ent;
    });
    const rootModule = SchemaUtilsV2.getModuleRoot(schemaModuleProps);
    return {
      root: rootModule,
      schemas: schemasDict,
      fname: rootModule.fname,
    };
  }

  parse(fpaths: string[], root: string): SchemaModuleV2[] {
    return fpaths.flatMap((fpath) => {
      return SchemaParserV2.parseFile(fpath, root);
    });
  }
}

type NotePropsCacheV2 = {};

type NoteEntryV2 = {
  mtime: number;
  size: number;
  hash: number;
};

type MetaEntryV2 = {
  links: any[];
  embeds: any[];
  tags: any[];
  headings: any[];
};

export class FileStorageV2 implements DStoreV2 {
  public vaults: string[];
  public notes: NotePropsDictV2;
  public schemas: SchemaModuleDictV2;
  public notesCache: NotePropsCacheV2;
  public logger: DLogger;

  constructor(props: { vaults: string[]; logger: DLogger }) {
    const { vaults, logger } = props;
    this.vaults = vaults;
    this.notes = {};
    this.schemas = {};
    this.notesCache = {};
    this.logger = logger;
    const ctx = "FileStorageV2";
    this.logger.info({ ctx, vaults });
  }

  async init(): Promise<DEngineInitPayloadV2> {
    try {
      const _schemas = await this.initSchema();
      const _notes = await this.initNotes();
      _schemas.map((ent) => {
        this.schemas[ent.root.id] = ent;
      });
      _notes.map((ent) => {
        this.notes[ent.id] = ent;
      });
      const { notes, schemas } = this;
      return { notes, schemas };
    } catch (err) {
      this.logger.error(err);
      throw err;
    }
  }

  loadNotesCache(): NotePropsCacheV2 {
    return {};
  }

  async initSchema(): Promise<SchemaModuleV2[]> {
    const ctx = "initSchema";
    this.logger.info({ ctx, msg: "enter" });
    const schemaFiles = getAllFiles({
      root: this.vaults[0],
      include: ["*.schema.yml"],
    }) as string[];
    this.logger.info({ ctx, schemaFiles });
    const root = this.vaults[0];
    if (_.isEmpty(schemaFiles)) {
      throw new DendronError({ status: ENGINE_ERROR_CODES.NO_SCHEMA_FOUND });
    }
    return new SchemaParserV2({ store: this, logger: this.logger }).parse(
      schemaFiles,
      root
    );
  }

  async initNotes(): Promise<NotePropsV2[]> {
    const ctx = "initNotes";
    this.logger.info({ ctx, msg: "enter" });
    const noteFiles = getAllFiles({
      root: this.vaults[0],
      include: ["*.md"],
    }) as string[];
    const cache = this.loadNotesCache();
    const root = this.vaults[0];
    return new NoteParserV2({ store: this, cache, logger: this.logger }).parse(
      noteFiles
    );
  }

  async updateNote(
    note: NotePropsV2,
    opts?: EngineUpdateNodesOptsV2
  ): Promise<void> {
    throw Error("not implemented");
    return;
  }

  async updateSchema(schemaModule: SchemaModulePropsV2) {
    const vault = this.vaults[0];
    const schemas = SchemaParserV2.parseSchemaModuleProps(schemaModule, {
      fname: schemaModule.schemas[0].fname,
      root: vault,
    });
    this.schemas[schemas.root.id] = schemas;
    return;
  }

  async writeNote(note: NotePropsV2, opts?: EngineWriteOptsV2): Promise<void> {
    throw Error("to implement");
    return;
  }

  async writeSchema(schemaModule: SchemaModulePropsV2) {
    return this.updateSchema(schemaModule);
  }
}
