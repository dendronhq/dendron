import {
  assertUnreachable,
  DendronError,
  DendronSiteConfig,
  error2PlainObject,
  getStage,
  Stage,
} from "@dendronhq/common-all";
import { execa } from "@dendronhq/engine-server";
import { NextjsExportPod } from "@dendronhq/pods-core";
import path from "path";
import yargs from "yargs";
import { CLICommand } from "./base";
import { ExportPodCLICommand } from "./exportPod";
import { PodSource } from "./pod";

const $ = (cmd: string, opts?: any) => {
  return execa.commandSync(cmd, { shell: true, ...opts });
};

type CommandCLIOpts = {
  cmd: PublishCommands;
  wsRoot: string;
  dest?: string;
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

type CommandOpts = CommandCLIOpts & Partial<BuildCmdOpts>;

type CommandOutput = Partial<{ error: DendronError; data: any }>;

type BuildCmdOpts = {} & CommandCLIOpts;

export { CommandOpts as PublishCLICommandOpts };

const getNextRoot = (wsRoot: string) => {
  return path.join(wsRoot, ".next");
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
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    return { ...args };
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

  async _buildNextData({
    wsRoot,
    stage,
    dest,
  }: {
    wsRoot: string;
    stage: Stage;
    dest?: string;
  }) {
    const cli = new ExportPodCLICommand();
    const opts = await cli.enrichArgs({
      podId: NextjsExportPod.id,
      podSource: PodSource.BUILTIN,
      wsRoot,
      config: `dest=${dest || getNextRoot(wsRoot)}`,
    });
    // if no siteUrl set, override with localhost
    if (stage !== "prod") {
      if (!opts.engine.config.site.siteUrl) {
        (opts.config as DendronSiteConfig).siteUrl = "localhost:3000";
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

  async build({ wsRoot, dest }: { wsRoot: string; dest?: string }) {
    this.print(`generating metadata for publishing...`);
    await this._buildNextData({ wsRoot, stage: getStage(), dest });
    this.print(
      `to preview changes, run "cd ${getNextRoot(wsRoot)} && npx dev"`
    );
    return { error: null };
  }
}
