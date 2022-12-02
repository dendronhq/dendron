import {
  assertUnreachable,
  ConfigService,
  ConfigUtils,
  DendronError,
  DendronPublishingConfig,
  error2PlainObject,
  getStage,
  Stage,
  URI,
} from "@dendronhq/common-all";
import { SiteUtils } from "@dendronhq/engine-server";
import {
  NextjsExportConfig,
  NextjsExportPod,
  NextjsExportPodUtils,
  BuildOverrides,
  PublishTarget,
} from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { CLIUtils, SpinnerUtils } from "../utils/cli";
import { CLICommand } from "./base";
import { ExportPodCLICommand } from "./exportPod";
import { PodSource } from "./pod";
import { SetupEngineCLIOpts } from "./utils";
import prompts from "prompts";
import fs from "fs-extra";
import ora from "ora";
import { GitUtils } from "@dendronhq/common-server";

type CommandCLIOpts = {
  cmd: PublishCommands;
  wsRoot: string;
  dest?: string;
  error?: DendronError;
  /**
   * Should build sitemap
   */
  sitemap?: boolean;
} & CommandCLIOnlyOpts &
  Pick<SetupEngineCLIOpts, "attach">;

type CommandCLIOnlyOpts = {
  overrides?: string;
};

export enum PublishCommands {
  /**
   * Initiliaze the nextjs-template from Dendron in the dendron workspace
   */
  INIT = "init",
  /**
   * Create metadata needed to builid dendron nextjs template
   */
  BUILD = "build",
  /**
   * Builds the website
   */
  DEV = "dev",
  /**
   * Export website
   */
  EXPORT = "export",
}

type CommandOpts = Omit<CommandCLIOpts, "overrides"> & Partial<ExportCmdOpts>;

type CommandOutput = Partial<{ error: DendronError; data: any }>;

type BuildCmdOpts = Omit<CommandCLIOpts, keyof CommandCLIOnlyOpts> & {
  /**
   * Use existing engine instead of spawning a new one
   */
  attach?: boolean;
  /**
   * Override site config with custom values
   */
  overrides?: BuildOverrides;
};
type DevCmdOpts = BuildCmdOpts & { noBuild?: boolean };
type ExportCmdOpts = DevCmdOpts & { target?: PublishTarget; yes?: boolean };

export { CommandOpts as PublishCLICommandOpts };
export { CommandCLIOpts as PublishCLICommandCLIOpts };

const getNextRoot = (wsRoot: string) => {
  return path.join(wsRoot, ".next");
};

const isBuildOverrideKey = (key: string): key is keyof BuildOverrides => {
  const allowedKeys = [
    "siteUrl",
    "assetsPrefix",
  ] as (keyof DendronPublishingConfig)[];
  return allowedKeys.includes(key as any);
};

/**
 * To use when working on dendron
 */
export class PublishCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({
      name: "publish <cmd>",
      desc: "commands for publishing notes",
    });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    args.positional("cmd", {
      describe: "a command to run",
      choices: Object.values(PublishCommands),
      type: "string",
    });
    args.option("dest", {
      describe: "override where nextjs-template is located",
      type: "string",
    });
    args.option("attach", {
      describe: "use existing dendron engine instead of spawning a new one",
      type: "boolean",
    });
    args.option("noBuild", {
      describe: "skip building notes",
      type: "boolean",
      default: false,
    });
    args.option("overrides", {
      describe: "override existing siteConfig properties",
      type: "string",
    });
    args.option("target", {
      describe: "export to specific destination",
      choices: _.values(PublishTarget),
    });
    args.option("yes", {
      describe: "automatically say yes to all prompts",
      type: "boolean",
    });
    args.option("sitemap", {
      describe: "generates a sitemap: https://en.wikipedia.org/wiki/Site_map",
      type: "boolean",
    });
  }

  async enrichArgs(args: CommandCLIOpts) {
    this.addArgsToPayload({ cmd: args.cmd });
    let error: DendronError | undefined;
    const coverrides: BuildOverrides = {};
    if (!_.isUndefined(args.overrides)) {
      args.overrides.split(",").map((ent) => {
        const [k, v] = _.trim(ent).split("=");
        if (isBuildOverrideKey(k)) {
          coverrides[k] = v;
        } else {
          error = new DendronError({
            message: `bad key for override. ${k} is not a valid key`,
          });
        }
      });
    }
    if (error) {
      return { error };
    }
    return {
      data: { ..._.omit(args, "overrides"), overrides: coverrides },
    };
  }

  async execute(opts: CommandOpts) {
    const { cmd } = opts;
    const ctx = "execute";
    this.L.info({ ctx });
    const spinner = ora().start();
    try {
      switch (cmd) {
        case PublishCommands.INIT: {
          const out = await this.init({ ...opts, spinner });
          spinner.stop();
          return out;
        }
        case PublishCommands.BUILD: {
          spinner.stop();
          return this.build(opts);
        }
        case PublishCommands.DEV: {
          const { wsRoot } = opts;
          const isInitialized = await this._isInitialized({ wsRoot, spinner });
          if (!isInitialized) {
            await this.init({ ...opts, spinner });
          }
          if (opts.noBuild) {
            SpinnerUtils.renderAndContinue({
              spinner,
              text: "skipping build...",
            });
          } else {
            spinner.stop();
            await this.build(opts);
          }
          await this.dev(opts);
          return { error: null };
        }
        case PublishCommands.EXPORT: {
          const { wsRoot } = opts;
          const isInitialized = await this._isInitialized({ wsRoot, spinner });
          if (!isInitialized) {
            await this.init({ ...opts, spinner });
          }
          if (opts.noBuild) {
            SpinnerUtils.renderAndContinue({
              spinner,
              text: "skipping build...",
            });
          } else {
            await this.build(opts);
          }
          spinner.stop();
          await this.export(opts);
          if (opts.target) {
            await this._handlePublishTarget(opts.target, opts);
          }
          return { error: null };
        }
        default:
          assertUnreachable(cmd);
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

  async _buildNextData({
    wsRoot,
    stage,
    dest,
    attach,
    overrides,
  }: {
    stage: Stage;
  } & Pick<CommandOpts, "attach" | "dest" | "wsRoot" | "overrides">) {
    const cli = new ExportPodCLICommand();
    // create config string
    const podConfig: NextjsExportConfig = {
      dest: dest || getNextRoot(wsRoot),
    };
    const resp = await cli.enrichArgs({
      podId: NextjsExportPod.id,
      podSource: PodSource.BUILTIN,
      wsRoot,
      config: CLIUtils.objectConfig2StringConfig(podConfig),
      attach,
    });
    if (resp.error) {
      return { error: resp.error };
    }
    const opts = resp.data;
    opts.config.overrides = overrides || {};

    // if no siteUrl set, override with localhost
    const configReadResult = await ConfigService.instance().readConfig(
      URI.file(opts.engine.wsRoot)
    );
    if (configReadResult.isErr()) {
      return { error: configReadResult.error };
    }
    const config = configReadResult.value;
    const publishingConfig = ConfigUtils.getPublishing(config);
    if (stage !== "prod") {
      if (!publishingConfig.siteUrl && !overrides?.siteUrl) {
        _.set(
          opts.config.overrides as Partial<DendronPublishingConfig>,
          "siteUrl",
          "localhost:3000"
        );
      }
    }
    const { error } = SiteUtils.validateConfig(publishingConfig);
    if (error) {
      return { error };
    }
    return { data: await cli.execute(opts) };
  }

  async _handlePublishTarget(target: PublishTarget, opts: ExportCmdOpts) {
    const { wsRoot } = opts;
    switch (target) {
      case PublishTarget.GITHUB: {
        const docsPath = path.join(wsRoot, "docs");
        const outPath = path.join(wsRoot, ".next", "out");
        this.print("building github target...");

        // if `out` no exist, exit
        if (!fs.pathExistsSync(outPath)) {
          this.print(`${outPath} does not exist. exiting`);
          return;
        }

        // if docs exist, remove
        const docsExist = fs.pathExistsSync(docsPath);
        if (docsExist) {
          if (!opts.yes) {
            const response = await prompts({
              type: "confirm",
              name: "value",
              message: "Docs folder exists. Delete?",
              initial: false,
            });
            if (!response.value) {
              this.print("exiting");
              return;
            }
          }
          fs.removeSync(docsPath);
        }

        // build docs
        fs.moveSync(outPath, docsPath);
        fs.ensureFileSync(path.join(docsPath, ".nojekyll"));
        this.print(`done export. files available at ${docsPath}`);
        return;
      }
      default:
        assertUnreachable(target);
    }
  }

  async init(opts: { wsRoot: string; spinner: ora.Ora }) {
    const { wsRoot, spinner } = opts;
    GitUtils.addToGitignore({ addPath: ".next", root: wsRoot });
    const nextPath = NextjsExportPodUtils.getNextRoot(wsRoot);

    const nextPathExists = await this._nextPathExists({
      nextPath,
      spinner,
    });

    if (nextPathExists) {
      try {
        await this._updateNextTemplate({
          nextPath,
          spinner,
        });
      } catch (err) {
        SpinnerUtils.renderAndContinue({
          spinner,
          text: `failed to update next NextJS template working copy (${err}); cloning fresh`,
        });
        await this._removeNextPath({
          nextPath,
          spinner,
        });
        await this._initialize({ nextPath, spinner });
      }
    } else {
      await this._initialize({ nextPath, spinner });
    }

    return { error: null };
  }

  async _isInitialized(opts: { wsRoot: string; spinner: ora.Ora }) {
    const { spinner, wsRoot } = opts;
    spinner.start();
    SpinnerUtils.renderAndContinue({
      spinner,
      text: "checking if NextJS template is initialized",
    });
    const isInitialized = await NextjsExportPodUtils.isInitialized({
      wsRoot,
    });
    SpinnerUtils.renderAndContinue({
      spinner,
      text: `NextJS template is ${
        isInitialized ? "already" : "not"
      } initialized.`,
    });
    return isInitialized;
  }

  async _nextPathExists(opts: { nextPath: string; spinner: ora.Ora }) {
    const { spinner, nextPath } = opts;
    const nextPathBase = path.basename(nextPath);
    SpinnerUtils.renderAndContinue({
      spinner,
      text: `checking if ${nextPathBase} directory exists.`,
    });
    const nextPathExists = await NextjsExportPodUtils.nextPathExists({
      nextPath,
    });
    SpinnerUtils.renderAndContinue({
      spinner,
      text: `${nextPathBase} directory ${
        nextPathExists ? "exists" : "does not exist"
      }`,
    });
    return nextPathExists;
  }

  async _updateNextTemplate(opts: { nextPath: string; spinner: ora.Ora }) {
    const { spinner, nextPath } = opts;
    SpinnerUtils.renderAndContinue({
      spinner,
      text: `updating NextJS template.`,
    });
    await NextjsExportPodUtils.updateTemplate({
      nextPath,
    });
    await this._installDependencies(opts);
    SpinnerUtils.renderAndContinue({
      spinner,
      text: `updated NextJS template.`,
    });
  }

  async _removeNextPath(opts: { nextPath: string; spinner: ora.Ora }) {
    const { spinner, nextPath } = opts;
    const nextPathBase = path.basename(nextPath);
    await NextjsExportPodUtils.removeNextPath({
      nextPath,
    });
    SpinnerUtils.renderAndContinue({
      spinner,
      text: `existing ${nextPathBase} directory deleted.`,
    });
  }

  async _initialize(opts: { nextPath: string; spinner: ora.Ora }) {
    const { spinner } = opts;
    SpinnerUtils.renderAndContinue({
      spinner,
      text: "Initializing NextJS template.",
    });
    await this._cloneTemplate(opts);
    await this._installDependencies(opts);
  }

  async _cloneTemplate(opts: { nextPath: string; spinner: ora.Ora }) {
    const { nextPath, spinner } = opts;
    spinner.stop();
    spinner.start("Cloning NextJS template...");

    await NextjsExportPodUtils.cloneTemplate({ nextPath });
    SpinnerUtils.renderAndContinue({
      spinner,
      text: "Successfully cloned.",
    });
  }

  async _installDependencies(opts: { nextPath: string; spinner: ora.Ora }) {
    const { nextPath, spinner } = opts;
    spinner.stop();
    spinner.start("Installing dependencies... This may take a while.");
    await NextjsExportPodUtils.installDependencies({ nextPath });
    SpinnerUtils.renderAndContinue({
      spinner,
      text: "All dependencies installed.",
    });
  }

  async build({ wsRoot, dest, attach, overrides, sitemap }: BuildCmdOpts) {
    this.print(`generating metadata for publishing...`);
    const { error } = await this._buildNextData({
      wsRoot,
      stage: getStage(),
      dest,
      attach,
      overrides,
    });
    if (error) {
      this.print("ERROR: " + error.message);
      return { error };
    }
    if (sitemap) {
      const nextPath = NextjsExportPodUtils.getNextRoot(wsRoot);
      await NextjsExportPodUtils.buildSiteMap({ nextPath });
    }
    return { error: null };
  }

  async dev(opts: DevCmdOpts) {
    const nextPath = NextjsExportPodUtils.getNextRoot(opts.wsRoot);
    await NextjsExportPodUtils.startNextDev({ nextPath, windowsHide: false });
    return { error: null };
  }

  async export(opts: ExportCmdOpts) {
    const nextPath = NextjsExportPodUtils.getNextRoot(opts.wsRoot);
    await NextjsExportPodUtils.startNextExport({ nextPath });
  }
}
