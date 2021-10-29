import {
  assertUnreachable,
  DendronError,
  DendronSiteConfig,
  error2PlainObject,
  getStage,
  Stage,
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
import { CLIUtils } from "../utils/cli";
import { CLICommand } from "./base";
import { ExportPodCLICommand } from "./exportPod";
import { PodSource } from "./pod";
import { SetupEngineCLIOpts } from "./utils";
import prompts from "prompts";
import fs from "fs-extra";

type CommandCLIOpts = {
  cmd: PublishCommands;
  wsRoot: string;
  dest?: string;
  error?: DendronError;
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
   * Use existing engine instead of spwaning a new one
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
  ] as (keyof DendronSiteConfig)[];
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
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
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
    return { ..._.omit(args, "overrides"), overrides: coverrides, error };
  }

  async execute(opts: CommandOpts) {
    const { cmd } = opts;
    const ctx = "execute";
    this.L.info({ ctx });
    try {
      switch (cmd) {
        case PublishCommands.INIT: {
          return await this.init(opts);
        }
        case PublishCommands.BUILD: {
          return this.build(opts);
        }
        case PublishCommands.DEV: {
          await this.dev(opts);
          return { error: null };
        }
        case PublishCommands.EXPORT: {
          await this.export(opts);
          if (opts.target) {
            await this._handlePublishTarget(opts.target, opts);
          }
          return { error: null };
        }
        default:
          assertUnreachable();
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
    const opts = await cli.enrichArgs({
      podId: NextjsExportPod.id,
      podSource: PodSource.BUILTIN,
      wsRoot,
      config: CLIUtils.objectConfig2StringConfig(podConfig),
      attach,
    });
    opts.config.overrides = overrides || {};
    // if no siteUrl set, override with localhost
    if (stage !== "prod") {
      if (!opts.engine.config.site.siteUrl && !overrides?.siteUrl) {
        _.set(
          opts.config.overrides as Partial<DendronSiteConfig>,
          "siteUrl",
          "localhost:3000"
        );
      }
    }
    const { data, error } = SiteUtils.validateConfig(opts.engine.config.site);
    if (!data) {
      return { data, error };
    }
    return { data: await cli.execute(opts), error: null };
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
        assertUnreachable();
    }
  }

  async init(opts: { wsRoot: string }) {
    const nextPath = NextjsExportPodUtils.getNextRoot(opts.wsRoot);
    const nextPathExists = await NextjsExportPodUtils.nextPathExists({
      nextPath,
    });
    if (nextPathExists) {
      await NextjsExportPodUtils.removeNextPath({ nextPath });
    }
    await NextjsExportPodUtils.initialize({ nextPath });
    return { error: null };
  }

  async build({ wsRoot, dest, attach, overrides }: BuildCmdOpts) {
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
    return { error: null };
  }

  async dev(opts: DevCmdOpts) {
    if (opts.noBuild) {
      this.print("skipping build...");
    } else {
      await this.build(opts);
    }
    const nextPath = NextjsExportPodUtils.getNextRoot(opts.wsRoot);
    await NextjsExportPodUtils.startNextDev({ nextPath });
    return { error: null };
  }

  async export(opts: ExportCmdOpts) {
    if (opts.noBuild) {
      this.print("skipping build...");
    } else {
      this.print("ssdfoiwjeofijweoifj");
      await this.build(opts);
    }
    const nextPath = NextjsExportPodUtils.getNextRoot(opts.wsRoot);
    await NextjsExportPodUtils.startNextExport({ nextPath });
  }
}
