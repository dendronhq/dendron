import {
  DendronError,
  DVault,
  ERROR_STATUS,
  SchemaModuleProps,
} from "@dendronhq/common-all";
import {
  SchemaParserV2 as cSchemaParserV2,
  vault2Path,
} from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import YAML from "yamljs";
import { ParserBase } from "./parseBase";

export class SchemaParser extends ParserBase {
  async parseFile(fpath: string, root: DVault): Promise<SchemaModuleProps> {
    const fname = path.basename(fpath, ".schema.yml");
    const wsRoot = this.opts.store.wsRoot;
    const vpath = vault2Path({ vault: root, wsRoot });
    const schemaOpts: any = YAML.parse(
      fs.readFileSync(path.join(vpath, fpath), "utf8")
    );
    return await cSchemaParserV2.parseRaw(schemaOpts, { root, fname, wsRoot });
  }

  async parse(
    fpaths: string[],
    vault: DVault
  ): Promise<{
    schemas: SchemaModuleProps[];
    errors: DendronError[] | null;
  }> {
    const ctx = "parse";
    this.logger.info({ ctx, msg: "enter", fpaths, vault });

    const out = await Promise.all(
      fpaths.flatMap(async (fpath) => {
        try {
          return await this.parseFile(fpath, vault);
        } catch (err) {
          return new DendronError({
            message: ERROR_STATUS.BAD_PARSE_FOR_SCHEMA,
            payload: { fpath },
          });
        }
      })
    );
    let errors = _.filter(
      out,
      (ent) => ent instanceof DendronError
    ) as DendronError[];
    return {
      schemas: _.reject(
        out,
        (ent) => ent instanceof DendronError
      ) as SchemaModuleProps[],
      errors: _.isEmpty(errors) ? null : errors,
    };
  }
}
