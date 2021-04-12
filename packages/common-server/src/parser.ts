import {
  DendronError,
  DNodeUtils,
  DStoreV2,
  DVault,
  ENGINE_ERROR_CODES,
  SchemaModuleOpts,
  SchemaModuleProps,
  SchemaOpts,
  SchemaPropsDict,
  SchemaProps,
  SchemaUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { file2Schema, vault2Path } from "./filesv2";
import { DLogger } from "./logger";
import { createLogger } from "./logger";

let _LOGGER: DLogger | undefined;

function getLogger() {
  if (!_LOGGER) {
    _LOGGER = createLogger();
  }
  return _LOGGER;
}

export class ParserBaseV2 {
  constructor(public opts: { store: DStoreV2; logger: any }) {}

  get logger() {
    return this.opts.logger;
  }
}

export class SchemaParserV2 extends ParserBaseV2 {
  static parseRaw(
    schemaOpts: SchemaModuleOpts,
    opts: { root: DVault; fname: string; wsRoot: string }
  ): SchemaModuleProps {
    const version = _.isArray(schemaOpts) ? 0 : 1;
    if (version > 0) {
      return SchemaParserV2.parseSchemaModuleOpts(
        schemaOpts as SchemaModuleOpts,
        opts
      );
    } else {
      // TODO: legacy
      const schemaDict: SchemaPropsDict = {};
      ((schemaOpts as unknown) as SchemaOpts[]).map((ent) => {
        const schema = SchemaUtils.create(ent);
        schemaDict[schema.id] = schema;
      });
      const maybeRoot = _.find(_.values(schemaDict), {
        parent: "root",
      }) as SchemaProps;
      return {
        version: 0,
        root: maybeRoot,
        schemas: schemaDict,
        fname: opts.fname,
        vault: opts.root,
      };
    }
  }

  static parseSchemaModuleOpts(
    schemaModuleProps: SchemaModuleOpts,
    opts: { fname: string; root: DVault; wsRoot: string }
  ): SchemaModuleProps {
    const { imports, schemas, version } = schemaModuleProps;
    const { fname, root, wsRoot } = opts;
    getLogger().info({ ctx: "parseSchemaModuleOpts", fname, root, imports });
    const vpath = vault2Path({ vault: root, wsRoot });
    let schemaModulesFromImport = _.flatMap(imports, (ent) => {
      const fpath = path.join(vpath, ent + ".schema.yml");
      return file2Schema(fpath, wsRoot);
    });
    const schemaPropsFromImport = schemaModulesFromImport.flatMap((mod) => {
      const domain = mod.fname;
      return _.values(mod.schemas).map((ent) => {
        ent.data.pattern = ent.data.pattern || ent.id;
        ent.id = `${domain}.${ent.id}`;
        ent.fname = fname;
        ent.parent = null;
        ent.children = ent.children.map((ent) => `${domain}.${ent}`);
        ent.vault = root;
        return ent;
      });
    });
    getLogger().debug({ ctx: "parseSchemaModuleOpts", schemaPropsFromImport });
    const schemaPropsFromFile = schemas.map((ent) => {
      return SchemaUtils.create({ ...ent, vault: root });
    });
    getLogger().debug({ ctx: "parseSchemaModuleOpts", schemaPropsFromFile });
    const schemasAll = schemaPropsFromImport.concat(schemaPropsFromFile);

    const schemasDict: SchemaPropsDict = {};
    schemasAll.forEach((ent) => {
      schemasDict[ent.id] = ent;
    });

    const rootModule = SchemaUtils.getModuleRoot(schemaModuleProps);

    const addConnections = (parent: SchemaProps) => {
      _.map(parent.children, (ch) => {
        const child = schemasDict[ch];
        if (!child) {
          throw new DendronError({
            status: ENGINE_ERROR_CODES.MISSING_SCHEMA,
            msg: JSON.stringify({ parent, missingChild: ch }),
          });
        }
        DNodeUtils.addChild(parent, child);
        return addConnections(child);
      });
    };
    // add parent relationship
    addConnections(rootModule);

    return {
      version,
      imports,
      root: rootModule,
      schemas: schemasDict,
      fname,
      vault: root,
    };
  }
}
