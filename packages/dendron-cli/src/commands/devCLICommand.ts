import {
  assertUnreachable,
  CLIEvents,
  DendronError,
  DVault,
  ERROR_STATUS,
  NoteProps,
  NoteUtils,
  stringifyError,
  TimeUtils,
} from "@dendronhq/common-all";
import {
  DConfig,
  readYAML,
  SegmentClient,
  TelemetryStatus,
} from "@dendronhq/common-server";
import {
  MigrationChangeSetStatus,
  MigrationService,
  MigrationUtils,
  MIGRATION_ENTRIES,
  WorkspaceService,
} from "@dendronhq/engine-server";
import fs from "fs-extra";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { CLIAnalyticsUtils, setupEngine } from "..";
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
  CREATE_TEST_VAULT = "create_test_vault",
  BUMP_VERSION = "bump_version",
  PUBLISH = "publish",
  SYNC_ASSETS = "sync_assets",
  SYNC_TUTORIAL = "sync_tutorial",
  PREP_PLUGIN = "prep_plugin",
  PACKAGE_PLUGIN = "package_plugin",
  INSTALL_PLUGIN = "install_plugin",
  ENABLE_TELEMETRY = "enable_telemetry",
  DISABLE_TELEMETRY = "disable_telemetry",
  SHOW_TELEMETRY = "show_telemetry",
  SHOW_MIGRATIONS = "show_migrations",
  RUN_MIGRATION = "run_migration",
}

type CommandOpts = CommandCLIOpts &
  CommandCommonProps &
  Partial<BuildCmdOpts> &
  Partial<RunMigrationOpts> &
  Partial<CreateTestVaultOpts>;

type CommandOutput = Partial<{ error: DendronError; data: any }>;

type BuildCmdOpts = {
  publishEndpoint: PublishEndpoint;
  fast?: boolean;
  extensionTarget: ExtensionTarget;
  skipSentry?: boolean;
} & BumpVersionOpts &
  PrepPluginOpts;

type CreateTestVaultOpts = {
  wsRoot: string;
  /**
   * Location of json data
   */
  jsonData: string;
} & CommandCLIOpts;

type BumpVersionOpts = {
  upgradeType: SemverVersion;
} & CommandCLIOpts;

type PrepPluginOpts = {
  extensionTarget: ExtensionTarget;
} & CommandCLIOpts;

type RunMigrationOpts = {
  migrationVersion: string;
  wsRoot: string;
} & CommandCLIOpts;

type JsonDataForCreateTestVault = {
  numNotes: number;
  numVaults: number;
  ratios: {
    tag: number;
    user: number;
    reg: number;
  };
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
    this.skipValidation = true;
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
    args.option("fast", {
      describe: "skip some checks",
    });
    args.option("skipSentry", {
      describe: "skip upload source map to sentry",
    });
    args.option("migrationVersion", {
      describe: "migration version to run",
      choices: MIGRATION_ENTRIES.map((m) => m.version),
    });
    args.option("wsRoot", {
      describe: "root directory of the Dendron workspace",
    });
    args.option("jsonData", {
      describe: "json data to pass into command",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    this.addArgsToPayload({ cmd: args.cmd });
    return { data: { ...args } };
  }

  async createTestVault({
    wsRoot,
    payload,
  }: {
    wsRoot: string;
    payload: JsonDataForCreateTestVault;
  }) {
    fs.ensureDirSync(wsRoot);
    fs.emptyDirSync(wsRoot);
    this.print(`creating test vault with ${JSON.stringify(payload)}`);

    const vaults: DVault[] = _.times(payload.numVaults, (idx) => {
      return { fsPath: `vault${idx}` };
    });
    const svc = await WorkspaceService.createWorkspace({
      additionalVaults: vaults,
      wsVault: { fsPath: "notes", selfContained: true },
      wsRoot,
      createCodeWorkspace: false,
      useSelfContainedVault: true,
    });
    await svc.initialize();

    const ratioTotal = _.values(payload.ratios).reduce(
      (acc, cur) => acc + cur,
      0
    );
    const vaultTotal = payload.numVaults;
    const { engine, server } = await setupEngine({ wsRoot });
    this.print(`vaults: ${JSON.stringify(svc.vaults)}`);

    await Promise.all(
      _.keys(payload.ratios).map(async (key) => {
        const numNotes = Math.round(
          (payload.ratios[key as keyof JsonDataForCreateTestVault["ratios"]] /
            ratioTotal) *
            payload.numNotes
        );
        this.print(`creating ${numNotes} ${key} notes...`);
        const vault = svc.vaults[_.random(0, vaultTotal - 1)];
        const notes: NoteProps[] = await Promise.all(
          _.times(numNotes, async (i) => {
            return NoteUtils.create({ fname: `${key}.${i}`, vault });
          })
        );
        await engine.bulkWriteNotes({ notes });
      })
    );
    return { server };
  }

  async generateJSONSchemaFromConfig() {
    const repoRoot = process.cwd();
    const pkgRoot = path.join(repoRoot, "packages", "engine-server");
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
    const configType = "ConfigForSchemaGenerator";
    // NOTE: this is removed by webpack when building plugin which is why we're loading this dynamically
    // eslint-disable-next-line global-require
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
        case DevCommands.CREATE_TEST_VAULT: {
          if (!this.validateCreateTestVaultArgs(opts)) {
            return {
              error: new DendronError({
                message: "missing required options",
              }),
            };
          }
          const { wsRoot, jsonData } = opts;
          const payload = fs.readJSONSync(
            jsonData
          ) as JsonDataForCreateTestVault;
          this.print(`reading json data from ${jsonData}`);
          const { server } = await this.createTestVault({ wsRoot, payload });
          if (server.close) {
            this.print("closing server...");
            server.close();
          }
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
          await this.syncAssets(opts);
          return { error: null };
        }
        case DevCommands.SYNC_TUTORIAL: {
          this.syncTutorial();
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
            await LernaUtils.publishVersion(opts.publishEndpoint);
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
          if (!opts.fast) {
            this.print("install deps...");
            BuildUtils.installPluginDependencies();
          }

          this.print("compiling plugin...");
          await BuildUtils.compilePlugin(opts);

          this.print("package deps...");
          await BuildUtils.packagePluginDependencies(opts);
          return { error: null };
        }
        case DevCommands.INSTALL_PLUGIN: {
          const currentVersion = BuildUtils.getCurrentVersion();
          await BuildUtils.installPluginLocally(currentVersion);
          return { error: null };
        }
        case DevCommands.ENABLE_TELEMETRY: {
          this.enableTelemetry();
          return { error: null };
        }
        case DevCommands.DISABLE_TELEMETRY: {
          this.disableTelemetry();
          return { error: null };
        }
        case DevCommands.SHOW_TELEMETRY: {
          CLIAnalyticsUtils.showTelemetryMessage();
          return { error: null };
        }
        case DevCommands.SHOW_MIGRATIONS: {
          this.showMigrations();
          return { error: null };
        }
        case DevCommands.RUN_MIGRATION: {
          if (!this.validateRunMigrationArgs(opts)) {
            return {
              error: new DendronError({
                message: "missing option(s) for run_migration command",
              }),
            };
          }
          this.runMigration(opts);
          return { error: null };
        }
        default:
          return assertUnreachable(cmd);
      }
    } catch (err: any) {
      this.L.error(err);
      if (err instanceof DendronError) {
        this.print(["status:", err.status, err.message].join(" "));
      } else {
        this.print("unknown error " + stringifyError(err));
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
      this.print("setting endpoint to local");
      await BuildUtils.prepPublishLocal();
    } else {
      this.print("setting endpoint to remote");
      await BuildUtils.prepPublishRemote();
    }

    if (!opts.fast) {
      this.print("run type-check...");
      BuildUtils.runTypeCheck();
    } else {
      this.print("skipping type-check...");
    }

    this.bumpVersion(opts);

    this.print("publish version...");
    await LernaUtils.publishVersion(opts.publishEndpoint);

    this.print("sync assets...");
    await this.syncAssets(opts);

    this.print("prep repo...");
    await BuildUtils.prepPluginPkg(opts.extensionTarget);

    if (!shouldPublishLocal) {
      this.print(
        "sleeping 2 mins for remote npm registry to have packages ready"
      );
      await TimeUtils.sleep(2 * 60 * 1000);
    } else {
      this.print("sleeping 6s for local npm registry to have packages ready");
      await TimeUtils.sleep(6 * 1000);
    }

    this.print("install deps...");
    BuildUtils.installPluginDependencies();

    this.print("compiling plugin...");
    await BuildUtils.compilePlugin(opts);

    this.print("package deps...");
    await BuildUtils.packagePluginDependencies(opts);

    this.print("setRegRemote...");
    BuildUtils.setRegRemote();

    if (!opts.fast) {
      this.print("restore package.json...");
      BuildUtils.restorePluginPkgJson();
    } else {
      this.print("skip restore package.json...");
    }

    this.L.info("done");
  }

  /**
   * Takes assets from different monorepo packages and copies them over to the plugin
   * @param param0
   * @returns
   */
  async syncAssets({ fast }: { fast?: boolean }) {
    if (!fast) {
      this.print("build plugin views for prod...");
      BuildUtils.buildPluginViews();
    }
    this.print("sync static...");
    const { staticPath } = await BuildUtils.syncStaticAssets();
    await BuildUtils.syncStaticAssetsToNextjsTemplate();
    return { staticPath };
  }

  syncTutorial() {
    const dendronSiteVaultPath = path.join(
      BuildUtils.getLernaRoot(),
      "docs",
      "seeds",
      "dendron.dendron-site",
      "vault"
    );

    const tutorialDirPath = path.join(
      BuildUtils.getPluginRootPath(),
      "assets",
      "dendron-ws",
      "tutorial"
    );

    const commonDirPath = path.join(tutorialDirPath, "common");

    // wipe everything in /assets/dendron-ws/tutorial/treatments
    const treatmentsDirPath = path.join(tutorialDirPath, "treatments");

    fs.removeSync(treatmentsDirPath);
    fs.ensureDirSync(treatmentsDirPath);

    // grab everything from `tutorial.*` hierarchy
    const tutorialNotePaths = fs
      .readdirSync(dendronSiteVaultPath)
      .filter((basename) => {
        return (
          basename.startsWith("tutorial.") &&
          basename.endsWith(".md") &&
          basename !== "tutorial.md"
        );
      });
    // determine treatment name
    const treatmentNames = _.uniq(
      tutorialNotePaths.map((basename) => basename.split(".")[1])
    );

    treatmentNames.forEach((treatmentName) => {
      // create directories for treatment
      const treatmentNameDirPath = path.join(treatmentsDirPath, treatmentName);
      fs.ensureDirSync(treatmentNameDirPath);
      // copy in commons (root, schema, assetdir)
      fs.copySync(commonDirPath, treatmentNameDirPath);
      // copy in individual treated tutorial notes
      tutorialNotePaths
        .filter((basename) => basename.startsWith(`tutorial.${treatmentName}`))
        .forEach((basename) => {
          const src = path.join(dendronSiteVaultPath, basename);
          const dest = path.join(
            treatmentNameDirPath,
            basename.replace(`tutorial.${treatmentName}`, "tutorial")
          );
          fs.copyFileSync(src, dest);
        });
    });
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

  validateCreateTestVaultArgs(opts: CommandOpts): opts is CreateTestVaultOpts {
    if (!opts.wsRoot || !opts.jsonData) {
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

  validateRunMigrationArgs(opts: CommandOpts): opts is RunMigrationOpts {
    if (!opts.wsRoot) {
      return false;
    }
    if (opts.migrationVersion) {
      return MIGRATION_ENTRIES.map((m) => m.version).includes(
        opts.migrationVersion
      );
    }
    return true;
  }

  enableTelemetry() {
    const reason = TelemetryStatus.ENABLED_BY_CLI_COMMAND;
    SegmentClient.enable(reason);
    CLIAnalyticsUtils.track(CLIEvents.CLITelemetryEnabled, { reason });
    const message = [
      "Telemetry is enabled.",
      "Thank you for helping us improve Dendron 🌱",
    ].join("\n");
    this.print(message);
  }

  disableTelemetry() {
    const reason = TelemetryStatus.DISABLED_BY_CLI_COMMAND;
    CLIAnalyticsUtils.track(CLIEvents.CLITelemetryDisabled, { reason });
    SegmentClient.disable(reason);
    const message = "Telemetry is disabled.";
    this.print(message);
  }

  showMigrations() {
    const headerMessage = [
      "",
      "Make note of the version number and use it in the run_migration command",
      "",
      "e.g.)",
      "> dendron dev run_migration --migrationVersion=0.64.1",
      "",
    ].join("\n");
    const body: string[] = [];
    let maxLength = 0;
    MIGRATION_ENTRIES.forEach((migrations) => {
      const version = migrations.version.padEnd(17);
      const changes = migrations.changes.map((set) => set.name).join(", ");
      const line = `${version}| ${changes}`;
      if (maxLength < line.length) maxLength = line.length;
      body.push(line);
    });

    const divider = "-".repeat(maxLength);

    this.print("======Available Migrations======");
    this.print(headerMessage);
    this.print(divider);
    this.print("version          | description");
    this.print(divider);
    this.print(body.join("\n"));
    this.print(divider);
  }

  async runMigration(opts: CommandOpts) {
    // grab the migration we want to run
    const migrationsToRun = MIGRATION_ENTRIES.filter(
      (m) => m.version === opts.migrationVersion
    );

    // run it
    const currentVersion = migrationsToRun[0].version;
    const wsService = new WorkspaceService({ wsRoot: opts.wsRoot! });
    const configPath = DConfig.configPath(opts.wsRoot!);
    const dendronConfig = readYAML(configPath);
    const wsConfig = wsService.getCodeWorkspaceSettingsSync();
    if (_.isUndefined(wsConfig)) {
      throw DendronError.createFromStatus({
        status: ERROR_STATUS.INVALID_STATE,
        message: "no workspace config found",
      });
    }
    const changes = await MigrationService.applyMigrationRules({
      currentVersion,
      previousVersion: "0.0.0",
      migrations: migrationsToRun,
      wsService,
      logger: this.L,
      wsConfig,
      dendronConfig,
    });

    // report
    if (changes.length > 0) {
      changes.forEach((change: MigrationChangeSetStatus) => {
        const event = _.isUndefined(change.error)
          ? CLIEvents.CLIMigrationSucceeded
          : CLIEvents.CLIMigrationFailed;

        CLIAnalyticsUtils.track(
          event,
          MigrationUtils.getMigrationAnalyticProps(change)
        );

        if (change.error) {
          this.print("Migration failed.");
          this.print(change.error.message);
        } else {
          this.print("Migration succeeded.");
        }
      });
    }
  }
}
