import {
  DendronError,
  DNodePointer,
  DNodeUtils,
  DStore,
  DVault,
  ERROR_SEVERITY,
  ERROR_STATUS,
  genUUID,
  SchemaModuleOpts,
  SchemaModuleProps,
  SchemaOpts,
  SchemaProps,
  SchemaPropsDict,
  SchemaUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import path from "path";
import { file2Schema, vault2Path } from "./filesv2";
import { createLogger, DLogger } from "./logger";

let _LOGGER: DLogger | undefined;

function getLogger() {
  if (!_LOGGER) {
    _LOGGER = createLogger();
  }
  return _LOGGER;
}

export class ParserBaseV2 {
  constructor(public opts: { store: DStore; logger: any }) {}

  get logger() {
    return this.opts.logger;
  }
}
const DEFAULT_LOG_CTX = "parsingSchemas";

async function getSchemasFromImport(
  imports: string[] | undefined,
  opts: { fname: string; root: DVault; wsRoot: string }
) {
  const vpath = vault2Path({ vault: opts.root, wsRoot: opts.wsRoot });
  let schemaModulesFromImport: SchemaModuleProps[] = [];
  await Promise.all(
    _.map(imports, async (ent) => {
      const fpath = path.join(vpath, ent + ".schema.yml");
      schemaModulesFromImport.push(await file2Schema(fpath, opts.wsRoot));
    })
  );
  const schemaPropsFromImport = schemaModulesFromImport.flatMap((mod) => {
    const domain = mod.fname;
    return _.values(mod.schemas).map((ent) => {
      ent.data.pattern = ent.data.pattern || ent.id;
      ent.id = `${domain}.${ent.id}`;
      ent.fname = opts.fname;
      ent.parent = null;
      ent.children = ent.children.map((ent) => `${domain}.${ent}`);
      ent.vault = opts.root;
      return ent;
    });
  });

  getLogger().debug({ ctx: DEFAULT_LOG_CTX, schemaPropsFromImport });

  return schemaPropsFromImport;
}

export class SchemaParserV2 extends ParserBaseV2 {
  static async parseRaw(
    schemaOpts: SchemaModuleOpts,
    opts: { root: DVault; fname: string; wsRoot: string }
  ): Promise<SchemaModuleProps> {
    const version = _.isArray(schemaOpts) ? 0 : 1;
    if (version > 0) {
      return await SchemaParserV2.parseSchemaModuleOpts(
        schemaOpts as SchemaModuleOpts,
        opts
      );
    } else {
      // TODO: legacy
      const schemaDict: SchemaPropsDict = {};
      (schemaOpts as unknown as SchemaOpts[]).map((ent) => {
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

  private static noInlineChildren(ent: SchemaOpts) {
    return (
      !ent.children || ent.children.length === 0 || _.isString(ent.children[0])
    );
  }

  private static getSchemasFromFile(schemas: SchemaOpts[], vault: DVault) {
    const collector: SchemaProps[] = [];

    schemas.forEach((ent) => {
      if (this.noInlineChildren(ent)) {
        // Means we are dealing with non-inline schema and can just collect
        // the parsed value.
        collector.push(SchemaUtils.create({ ...ent, vault }));
      } else {
        // When we are dealing with inline children we need to process/collect
        // the children bottom up from the inline tree and replace the children
        // object with collected/generated ids of the inline children.
        ent.children = this.processChildren(ent.children, collector, vault);

        // No all the entity children objects are collected and they have
        // been replaced with identifiers we can collect the root element itself.
        collector.push(SchemaUtils.create({ ...ent, vault }));
      }
    });

    getLogger().debug({ ctx: DEFAULT_LOG_CTX, schemaPropsFromFile: collector });

    return collector;
  }

  private static processChildren(
    children: any[] | undefined,
    collector: SchemaProps[],
    vault: DVault
  ): DNodePointer[] {
    if (!children) {
      return [];
    }

    return children.map((child) => {
      // To process the node we need all its children to already be processed
      // hence call process children recursively to process the graph from bottom up.
      child.children = this.processChildren(child.children, collector, vault);

      this.setIdIfMissing(child);

      collector.push(SchemaUtils.create({ ...child, vault }));

      return child.id;
    });
  }

  /**
   * Ids are optional for inline schemas hence if there isn't an id
   * we will generate the identifier. */
  private static setIdIfMissing(ent: any) {
    if (!ent.id) {
      // When id is missing than we must have a pattern for the schema.
      if (!ent.pattern) {
        throw new DendronError({
          message: `Pattern is missing in schema without id schema='${JSON.stringify(
            ent
          )}'`,
          // Setting severity as minor since Dendron could still be functional even
          // if some particular schema is malformed.
          severity: ERROR_SEVERITY.MINOR,
        });
      }

      ent.isIdAutoGenerated = true;
      ent.id = genUUID();
    }
  }

  static async parseSchemaModuleOpts(
    schemaModuleProps: SchemaModuleOpts,
    opts: { fname: string; root: DVault; wsRoot: string }
  ): Promise<SchemaModuleProps> {
    const { imports, schemas, version } = schemaModuleProps;
    const { fname, root } = opts;
    getLogger().info({ ctx: DEFAULT_LOG_CTX, fname, root, imports });

    const schemasAll = [
      ...(await getSchemasFromImport(imports, opts)),
      ...this.getSchemasFromFile(schemas, root),
    ];

    const schemasDict: SchemaPropsDict = {};
    schemasAll.forEach((ent) => {
      schemasDict[ent.id] = ent;
    });

    const addConnections = (parent: SchemaProps) => {
      _.forEach(parent.children, (ch) => {
        const child = schemasDict[ch];
        if (child) {
          DNodeUtils.addChild(parent, child);

          addConnections(child);
        } else {
          throw new DendronError({
            status: ERROR_STATUS.MISSING_SCHEMA,
            message: JSON.stringify({ parent, missingChild: ch }),
          });
        }
      });
    };

    // add parent relationship
    const rootModule = SchemaUtils.getModuleRoot(schemaModuleProps);
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
