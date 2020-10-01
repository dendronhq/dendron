import {
  DendronError,
  DEngineInitPayloadV2,
  DStoreV2,
  EngineUpdateNodesOptsV2,
  EngineWriteOptsV2,
  ENGINE_ERROR_CODES,
  NotePropsDictV2,
  NotePropsV2,
  SchemaModuleDictV2,
  SchemaModulePropsV2,
  SchemaModuleV2,
  SchemaOptsV2,
  SchemaPropsDictV2,
  SchemaPropsV2,
  SchemaUtils,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import { DLogger, getAllFiles } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import YAML from "yamljs";

export class ParserBaseV2 {
  constructor(public opts: { store: DStoreV2 }) {}
}

export class NoteParserV2 extends ParserBaseV2 {
  public cache: NotePropsCacheV2;

  constructor(public opts: { store: DStoreV2; cache: NotePropsCacheV2 }) {
    super(opts);
    this.cache = opts.cache;
  }

  parse(fpaths: string[]): NotePropsV2[] {
    fpaths.map((fpath) => {});
    return [];
  }
}

export class SchemaParserV2 extends ParserBaseV2 {
  parse(fpaths: string[], root: string): SchemaModuleV2[] {
    return fpaths.flatMap((fpath) => {
      return SchemaParserV2.parseFile(fpath, root);
    });
  }

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
    return new SchemaParserV2({ store: this }).parse(schemaFiles, root);
  }

  async initNotes(): Promise<NotePropsV2[]> {
    const schemaFiles = getAllFiles({
      root: this.vaults[0],
      include: ["*.md"],
    }) as string[];
    const cache = this.loadNotesCache();
    return new NoteParserV2({ store: this, cache }).parse(schemaFiles);
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
