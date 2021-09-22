import {
  assertUnreachable,
  DendronError,
  DendronSiteConfig,
  error2PlainObject,
  getStage,
  Stage,
} from "@dendronhq/common-all";
import { execa } from "@dendronhq/engine-server";
import { NextjsExportConfig, NextjsExportPod } from "@dendronhq/pods-core";
import _ from "lodash";
import path from "path";
import yargs from "yargs";
import { CLIUtils } from "../utils/cli";
import { CLICommand } from "./base";
import { ExportPodCLICommand } from "./exportPod";
import { PodSource } from "./pod";
import { SetupEngineCLIOpts } from "./utils";

const $ = (cmd: string, opts?: any) => {
  return execa.commandSync(cmd, { shell: true, ...opts });
};

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
}

type CommandOpts = Omit<CommandCLIOpts, "overrides"> & Partial<BuildCmdOpts>;

type CommandOutput = Partial<{ error: DendronError; data: any }>;

type BuildOverrides = Pick<DendronSiteConfig, "siteUrl">;

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
    args.option("overrides", {
      describe: "override existing siteConfig properties",
      type: "string",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    let error: DendronError | undefined;
    let coverrides: BuildOverrides = {};
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
          return this.init(opts);
        }
        case PublishCommands.BUILD: {
          return this.build(opts);
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
    } finally {
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
    let podConfig: NextjsExportConfig = {
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
    return cli.execute(opts);
  }

  init(opts: { wsRoot: string }) {
    const cwd = opts.wsRoot;
    this.print(`initializing publishing at ${cwd}...`);
    const cmd = `git clone https://github.com/dendronhq/nextjs-template.git .next`;
    $(cmd, { cwd });
    this.print(
      `run "cd ${getNextRoot(
        cwd
      )} && npm install" to finish the install process`
    );
    return { error: null };
  }

  async build({ wsRoot, dest, attach, overrides }: BuildCmdOpts) {
    this.print(`generating metadata for publishing...`);
    await this._buildNextData({
      wsRoot,
      stage: getStage(),
      dest,
      attach,
      overrides,
    });
    this.print(
      `to preview changes, run "cd ${getNextRoot(wsRoot)} && npx next dev"`
    );
    return { error: null };
  }
}
