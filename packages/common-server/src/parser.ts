import {
  DendronError,
  DNodeUtilsV2,
  DStoreV2,
  DVault,
  ENGINE_ERROR_CODES,
  SchemaModuleOptsV2,
  SchemaModulePropsV2,
  SchemaOptsV2,
  SchemaPropsDictV2,
  SchemaPropsV2,
  SchemaUtilsV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { file2Schema } from "./filesv2";

export class ParserBaseV2 {
  constructor(public opts: { store: DStoreV2; logger: any }) {}

  get logger() {
    return this.opts.logger;
  }
}

export class SchemaParserV2 extends ParserBaseV2 {
  static parseRaw(
    schemaOpts: SchemaModuleOptsV2,
    opts: { root: DVault; fname: string }
  ): SchemaModulePropsV2 {
    const version = _.isArray(schemaOpts) ? 0 : 1;
    if (version > 0) {
      return SchemaParserV2.parseSchemaModuleOpts(
        schemaOpts as SchemaModuleOptsV2,
        opts
      );
    } else {
      // TODO: legacy
      const schemaDict: SchemaPropsDictV2 = {};
      ((schemaOpts as unknown) as SchemaOptsV2[]).map((ent) => {
        const schema = SchemaUtilsV2.create(ent);
        schemaDict[schema.id] = schema;
      });
      const maybeRoot = _.find(_.values(schemaDict), {
        parent: "root",
      }) as SchemaPropsV2;
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
    schemaModuleProps: SchemaModuleOptsV2,
    opts: { fname: string; root: DVault }
  ): SchemaModulePropsV2 {
    const { imports, schemas, version } = schemaModuleProps;
    const { fname, root } = opts;
    let schemaModulesFromImport = _.flatMap(imports, (ent) => {
      const fpath = path.join(root.fsPath, ent + ".schema.yml");
      return file2Schema(fpath);
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
    const schemaPropsFromFile = schemas.map((ent) => {
      return SchemaUtilsV2.create({ ...ent, vault: root });
    });
    const schemasAll = schemaPropsFromImport.concat(schemaPropsFromFile);

    const schemasDict: SchemaPropsDictV2 = {};
    schemasAll.forEach((ent) => {
      schemasDict[ent.id] = ent;
    });

    const rootModule = SchemaUtilsV2.getModuleRoot(schemaModuleProps);

    const addConnections = (parent: SchemaPropsV2) => {
      _.map(parent.children, (ch) => {
        const child = schemasDict[ch];
        if (!child) {
          throw new DendronError({
            status: ENGINE_ERROR_CODES.MISSING_SCHEMA,
            msg: JSON.stringify({ parent, missingChild: ch }),
          });
        }
        DNodeUtilsV2.addChild(parent, child);
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
