import {
  assertUnreachable,
  DendronError,
  error2PlainObject,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import path from "path";
import yargs from "yargs";
import {
  BuildUtils,
  ExtensionTarget,
  LernaUtils,
  PublishEndpoint,
  SemverVersion,
} from "../utils/build";
import { CLICommand, CommandCommonProps } from "./base";

type CommandCLIOpts = {
  cmd: DevCommands;
};

export enum DevCommands {
  GENERATE_JSON_SCHEMA_FROM_CONFIG = "generate_json_schema_from_config",
  BUILD = "build",
  BUMP_VERSION = "bump_version",
  PUBLISH = "publish",
  SYNC_ASSETS = "sync_assets",
  PREP_PLUGIN = "prep_plugin",
  PACKAGE_PLUGIN = "package_plugin",
  INSTALL_PLUGIN = "install_plugin",
}

type CommandOpts = CommandCLIOpts & CommandCommonProps & Partial<BuildCmdOpts>;

type CommandOutput = Partial<{ error: DendronError; data: any }>;

type BuildCmdOpts = {
  publishEndpoint: PublishEndpoint;
} & BumpVersionOpts &
  PrepPluginOpts;

type BumpVersionOpts = {
  upgradeType: SemverVersion;
} & CommandCLIOpts;

type PrepPluginOpts = {
  extensionTarget: ExtensionTarget;
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

  private setEndpoint(publishEndpoint: PublishEndpoint) {
    this.print(`setting endpoint to ${publishEndpoint}...`);
    if (publishEndpoint === PublishEndpoint.LOCAL) {
      BuildUtils.prepPublishLocal();
    } else {
      BuildUtils.prepPublishRemote();
    }
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
    args.option("publishEndpoint", {
      describe: "where to publish",
      choices: Object.values(PublishEndpoint),
    });
    args.option("extensionTarget", {
      describe: "extension name to publish in the marketplace",
      choices: Object.values(ExtensionTarget),
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
    const pluginOutputPath = path.join(
      repoRoot,
      "packages",
      "plugin-core",
      "dist",
      "dendron-yml.validator.json"
    );
    const configType = "DendronConfig";
    // NOTE: this is removed by webpack when building plugin which is why we're loading this dynamically
    const tsj = require("ts-json-schema-generator");
    const schema = tsj
      .createGenerator({
        path: path.join(pkgRoot, "src", "config.ts"),
        tsconfig: path.join(pkgRoot, "tsconfig.build.json"),
        type: configType,
        skipTypeCheck: true,
      })
      .createSchema(configType);
    const schemaString = JSON.stringify(schema, null, 2);
    fs.ensureDirSync(path.dirname(pluginOutputPath));
    await Promise.all([
      fs.writeFile(nextOutputPath, schemaString),
      fs.writeFile(commonOutputPath, schemaString),
      fs.writeFile(pluginOutputPath, schemaString),
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
        case DevCommands.BUMP_VERSION: {
          if (!this.validateBumpVersionArgs(opts)) {
            return {
              error: new DendronError({
                message: "missing options for build command",
              }),
            };
          }
          await this.bumpVersion(opts);
          return { error: null };
        }
        case DevCommands.SYNC_ASSETS: {
          await this.syncAssets();
          return { error: null };
        }
        case DevCommands.PUBLISH: {
          if (!opts.publishEndpoint) {
            return {
              error: new DendronError({
                message: "missing options for cmd",
              }),
            };
          }
          try {
            this.setEndpoint(opts.publishEndpoint);
            LernaUtils.publishVersion();
          } finally {
            if (opts.publishEndpoint === PublishEndpoint.LOCAL) {
              BuildUtils.setRegRemote();
            }
          }
          return { error: null };
        }
        case DevCommands.PREP_PLUGIN: {
          if (!this.validatePrepPluginArgs(opts)) {
            return {
              error: new DendronError({
                message: "missing options for prep_plugin command",
              }),
            };
          }

          await BuildUtils.prepPluginPkg(opts.extensionTarget);
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
    } catch (err: any) {
      this.L.error(err);
      if (err instanceof DendronError) {
        this.print(["status:", err.status, err.message].join(" "));
      } else {
        this.print("unknown error " + error2PlainObject(err));
      }
      return { error: err };
    }
  }

  async bumpVersion(opts: BumpVersionOpts) {
    this.print("bump version...");
    LernaUtils.bumpVersion(opts.upgradeType);
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

    this.print("run type-check...");
    BuildUtils.runTypeCheck();

    this.bumpVersion(opts);

    this.print("publish version...");
    LernaUtils.publishVersion();

    this.print("sync assets...");
    await this.syncAssets();

    this.print("prep repo...");
    await BuildUtils.prepPluginPkg();

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

  validateBumpVersionArgs(opts: CommandOpts): opts is BumpVersionOpts {
    if (!opts.upgradeType) {
      return false;
    }
    return true;
  }

  validatePrepPluginArgs(opts: CommandOpts): opts is PrepPluginOpts {
    if (opts.extensionTarget) {
      return Object.values(ExtensionTarget).includes(opts.extensionTarget);
    }
    return true;
  }
}
