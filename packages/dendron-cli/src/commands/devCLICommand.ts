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
import { BuildUtils, LernaUtils, SemverVersion } from "../utils/build";

type CommandCLIOpts = {
  cmd: DevCommands;
};

export enum DevCommands {
  GENERATE_JSON_SCHEMA_FROM_CONFIG = "generate_json_schema_from_config",
  BUILD = "build",
}

type CommandOpts = CommandCLIOpts & Partial<BuildCmdOpts>; //& SetupEngineOpts & {};

type CommandOutput = Partial<{ error: DendronError; data: any }>;

type BuildCmdOpts = {
  upgradeType: SemverVersion;
} & CommandCLIOpts;

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
    args.option("upgradeType", {
      describe: "how to do upgrade",
      choices: Object.values(SemverVersion),
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    return { ...args };
  }

  async build(opts: BuildCmdOpts) {
    // get package version
    const currentVersion = BuildUtils.getCurrentVersion();
    const nextVersion = BuildUtils.genNextVersion({
      currentVersion,
      upgradeType: opts.upgradeType,
    });
    this.L.info({ currentVersion, nextVersion });

    this.print("setRegLocal...");
    // BuildUtils.setRegLocal();

    this.print("startVerdaccio...");
    BuildUtils.startVerdaccio();

    this.print("bump 11ty...");
    // BuildUtils.bump11ty({ currentVersion, nextVersion });

    this.print("run type-check...");
    // BuildUtils.runTypeCheck();

    this.print("bump version...");
    // LernaUtils.bumpVersion(opts.upgradeType);

    this.print("publish version...");
    LernaUtils.publishVersion();

    this.L.info("done");
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
        case DevCommands.BUILD: {
          if (!this.validateBuildArgs(opts)) {
            return {
              error: new DendronError({
                message: "missing options for build command",
              }),
            };
          }
          await this.build(opts);
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

  validateBuildArgs(opts: CommandOpts): opts is BuildCmdOpts {
    if (!opts.upgradeType) {
      return false;
    }
    return true;
  }
}
