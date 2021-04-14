import { WorkspaceService } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { CLICommand } from "./base";
import {
  setupEngine,
  setupEngineArgs,
  SetupEngineCLIOpts,
  SetupEngineResp,
} from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
  vault?: string;
  enginePort?: number;
  cmd: WorkspaceCommands;
};

type CommandOpts = CommandCLIOpts & SetupEngineResp & {};

type CommandOutput = any;

export enum WorkspaceCommands {
  PULL = "pull",
  PUSH = "push",
}

export { CommandOpts as WorkspaceCLICommandOpts };

export class WorkspaceCLICommand extends CLICommand<
  CommandOpts,
  CommandOutput
> {
  constructor() {
    super({ name: "workspace <cmd>", desc: "workspace related commands" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.positional("cmd", {
      describe: "a command to run",
      choices: Object.values(WorkspaceCommands),
      type: "string",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineOpts: SetupEngineCLIOpts = { ...args };
    if (_.includes(["pull", "push"], args.cmd)) {
      engineOpts.init = false;
    }
    const engineArgs = await setupEngine(engineOpts);
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts) {
    const { cmd, wsRoot } = opts;

    try {
      switch (cmd) {
        case WorkspaceCommands.PULL: {
          const ws = new WorkspaceService({ wsRoot });
          await ws.pullVaults();
          break;
        }
        case WorkspaceCommands.PUSH: {
          const ws = new WorkspaceService({ wsRoot });
          await ws.pushVaults();
          break;
        }
        default: {
          throw Error("bad option");
        }
      }
    } catch (err) {
      this.L.error(err);
    } finally {
      if (opts.server.close) {
        opts.server.close();
      }
    }
  }
}
