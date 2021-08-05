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
import execa from "execa";
import { BuildUtils } from "../utils/build";

type CommandCLIOpts = {
  cmd: DevCommands;
};

export enum DevCommands {
  GENERATE_JSON_SCHEMA_FROM_CONFIG = "generate_json_schema_from_config",
  BUILD = "build",
}

type CommandOpts = CommandCLIOpts; //& SetupEngineOpts & {};

type CommandOutput = Partial<{ error: DendronError; data: any }>;

const $ = (cmd: string) => {
  return execa.commandSync(cmd, { shell: true });
};

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

  async build() {
    const setRegLocal = () => {
      $(`yarn config set registry http://localhost:4873`);
      $(`npm set registry http://localhost:4873/`);
    };
    const startVerdaccio = () => {
      const subprocess = execa("verdaccio");
      const logger = this.L;
      logger.info({ state: "post:exec.node" });
      subprocess.on("close", () => {
        logger.error({ state: "close" });
      });
      subprocess.on("disconnect", () => {
        logger.error({ state: "disconnect" });
      });
      subprocess.on("exit", () => {
        logger.error({ state: "exit" });
      });
      subprocess.on("error", (err) => {
        logger.error({ state: "error", payload: err });
      });
      subprocess.on("message", (message) => {
        logger.info({ state: "message", message });
      });
      if (subprocess.stdout && subprocess.stderr) {
        subprocess.stdout.on("data", (chunk) => {
          process.stdout.write(chunk);
        });
        subprocess.stderr.on("data", (chunk) => {
          process.stdout.write(chunk);
        });
      }
      return subprocess;
    };

    const bump11ty = () => {
      $(
        `sed  -ibak "s/$VERSION_OLD/$VERSION_NEW/" packages/plugin-core/src/utils/site.ts`
      );
      $(`git add packages/plugin-core/src/utils/site.ts`);
      $(`git commit -m "chore: bump 11ty"`);
    };

    // this.print("setRegLocal...");
    // setRegLocal();

    // this.print("startVerdaccio...");
    // startVerdaccio();

    // get package version
    const currentVersion = BuildUtils.getCurrentVersion();
    this.L.info({ currentVersion });
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
          await this.build();
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
