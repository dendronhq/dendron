import {
  assertUnreachable,
  DendronError,
  error2PlainObject,
} from "@dendronhq/common-all";
import yargs from "yargs";
import { CLICommand } from "./base";
import * as tsj from "ts-json-schema-generator";
import path from "path";
import fs from "fs-extra";

type CommandCLIOpts = {
  cmd: DevCommands;
};

export enum DevCommands {
  GENERATE_JSON_SCHEMA_FROM_CONFIG = "generate_json_schema_from_config",
}

type CommandOpts = CommandCLIOpts; //& SetupEngineOpts & {};

type CommandOutput = Partial<{ error: DendronError; data: any }>;

export { CommandOpts as DevCLICommandOpts };

/**
 * To use when working on dendron
 */
export class DevCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({
      name: "dev <cmd>",
      desc: "commands related to development of Dendron",
    });
    this.wsRootOptional = true;
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.positional("cmd", {
      describe: "a command to run",
      choices: Object.values(DevCommands),
      type: "string",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    return { ...args };
  }

  async generateJSONSchemaFromConfig() {
    const repoRoot = process.cwd();
    const pkgRoot = path.join(repoRoot, "packages", "engine-server");
    const nextOutputPath = path.join(
      repoRoot,
      "packages",
      "dendron-next-server",
      "data",
      "dendron-yml.validator.json"
    );
    const commonOutputPath = path.join(
      repoRoot,
      "packages",
      "common-all",
      "data",
      "dendron-yml.validator.json"
    );
    const configType = "DendronConfig";
    const schema = tsj
      .createGenerator({
        path: path.join(pkgRoot, "src", "config.ts"),
        tsconfig: path.join(pkgRoot, "tsconfig.build.json"),
        type: configType,
        skipTypeCheck: true,
      })
      .createSchema(configType);
    const schemaString = JSON.stringify(schema, null, 2);
    await Promise.all([
      fs.writeFile(nextOutputPath, schemaString),
      fs.writeFile(commonOutputPath, schemaString),
    ]);
    return;
  }

  async execute(opts: CommandOpts) {
    const { cmd } = opts;
    const ctx = "execute";
    this.L.info({ ctx });
    try {
      switch (cmd) {
        case DevCommands.GENERATE_JSON_SCHEMA_FROM_CONFIG: {
          await this.generateJSONSchemaFromConfig();
          return { error: null };
        }
        default:
          return assertUnreachable();
      }
    } catch (err) {
      this.L.error(err);
      if (err instanceof DendronError) {
        this.print(["status:", err.status, err.message].join(" "));
      } else {
        this.print("unknown error " + error2PlainObject(err));
      }
      return { error: err };
    } finally {
    }
  }
}
