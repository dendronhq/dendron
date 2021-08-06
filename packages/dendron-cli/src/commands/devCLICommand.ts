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
import {
  BuildUtils,
  LernaUtils,
  PublishEndpoint,
  SemverVersion,
} from "../utils/build";

type CommandCLIOpts = {
  cmd: DevCommands;
};

export enum DevCommands {
  GENERATE_JSON_SCHEMA_FROM_CONFIG = "generate_json_schema_from_config",
  BUILD = "build",
  SYNC_ASSETS = "sync_assets",
  PREP_PLUGIN = "prep_plugin",
  PACKAGE_PLUGIN = "package_plugin",
  INSTALL_PLUGIN = "install_plugin",
}

type CommandOpts = CommandCLIOpts & Partial<BuildCmdOpts>; //& SetupEngineOpts & {};

type CommandOutput = Partial<{ error: DendronError; data: any }>;

type BuildCmdOpts = {
  upgradeType: SemverVersion;
  publishEndpoint: PublishEndpoint;
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
    args.option("publish endpoint", {
      describe: "where to publish",
      choices: Object.values(PublishEndpoint),
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
    BuildUtils.setRegLocal();

    this.print("startVerdaccio...");
    BuildUtils.startVerdaccio();
    // HACK: give verdaccio chance to start
    await BuildUtils.sleep(3000);

    this.print("bump 11ty...");
    BuildUtils.bump11ty({ currentVersion, nextVersion });

    this.print("run type-check...");
    BuildUtils.runTypeCheck();

    this.print("bump version...");
    LernaUtils.bumpVersion(opts.upgradeType);

    this.print("publish version...");
    LernaUtils.publishVersion();

    this.print("prep repo...");
    BuildUtils.prep();

    this.print("install deps...");
		BuildUtils.installPluginDependencies();

    this.print("package deps...");
		BuildUtils.packagePluginDependencies();

    this.print("setRegRemote...");
		BuildUtils.setRegRemote();

    this.print("restore package.json...");
		BuildUtils.restorePluginPkgJson();

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
        case DevCommands.SYNC_ASSETS: {
          await this.syncAssets();
          return { error: null };
        }
        case DevCommands.PREP_PLUGIN: {
          BuildUtils.prepPluginPkg();
          return { error: null };
        }
        case DevCommands.PACKAGE_PLUGIN: {
          this.print("install deps...");
          BuildUtils.installPluginDependencies();

          this.print("package deps...");
          BuildUtils.packagePluginDependencies();
          return { error: null };
        }
        case DevCommands.INSTALL_PLUGIN: {
          const currentVersion = BuildUtils.getCurrentVersion();
          await BuildUtils.installPluginLocally(currentVersion);
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

  async build(opts: BuildCmdOpts) {
    const ctx = "build";
    // get package version
    const currentVersion = BuildUtils.getCurrentVersion();
    const nextVersion = BuildUtils.genNextVersion({
      currentVersion,
      upgradeType: opts.upgradeType,
    });
    const shouldPublishLocal = opts.publishEndpoint === PublishEndpoint.LOCAL;
    this.L.info({ ctx, currentVersion, nextVersion });

		this.print(`prep publish ${opts.publishEndpoint}...`);
    if (shouldPublishLocal) {
      await BuildUtils.prepPublishLocal();
    } else {
      await BuildUtils.prepPublishRemote();
		}

    this.print("bump 11ty...");
    BuildUtils.bump11ty({ currentVersion, nextVersion });

    this.print("run type-check...");
    BuildUtils.runTypeCheck();

    this.print("bump version...");
    LernaUtils.bumpVersion(opts.upgradeType);

    this.print("publish version...");
    LernaUtils.publishVersion();

		this.print("sync assets...");
		await this.syncAssets();

    this.print("prep repo...");
    BuildUtils.prepPluginPkg();

    this.print("install deps...");
    BuildUtils.installPluginDependencies();

    this.print("package deps...");
    BuildUtils.packagePluginDependencies();

    this.print("setRegRemote...");
    BuildUtils.setRegRemote();

    this.print("restore package.json...");
    BuildUtils.restorePluginPkgJson();

    this.L.info("done");
  }

  async syncAssets() {
    this.print("build next server...");
    BuildUtils.buildNextServer();
    this.print("sync static...");
    await BuildUtils.syncStaticAssets();
    this.print("done");
  }

  validateBuildArgs(opts: CommandOpts): opts is BuildCmdOpts {
    if (!opts.upgradeType || !opts.publishEndpoint) {
      return false;
    }
    return true;
  }
}
