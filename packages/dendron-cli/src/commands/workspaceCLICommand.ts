import { DEngineClient, WorkspaceService } from "@dendronhq/engine-server";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
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

type CommandOpts = CommandCLIOpts &
  Omit<SetupEngineResp, "engine"> & {
    engine?: DEngineClient;
  } & CommandCommonProps;

type CommandOutput = CommandCommonProps & { data?: any };

export enum WorkspaceCommands {
  PULL = "pull",
  PUSH = "push",
  ADD_AND_COMMIT = "addAndCommit",
  SYNC = "sync",
  REMOVE_CACHE = "removeCache",
  INIT = "init",
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
    const engineOpts: SetupEngineCLIOpts = { ...args, init: false };
    const engineArgs = await setupEngine(engineOpts);
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts): Promise<CommandOutput> {
    const { cmd, wsRoot } = opts;

    try {
      switch (cmd) {
        case WorkspaceCommands.PULL: {
          const ws = new WorkspaceService({ wsRoot });
          await ws.pullVaults();
          break;
        }
        case WorkspaceCommands.INIT: {
          const ws = new WorkspaceService({ wsRoot });
          const out = await ws.initialize();
          return { data: out };
        }
        case WorkspaceCommands.ADD_AND_COMMIT: {
          const ws = new WorkspaceService({ wsRoot });
          await ws.commitAndAddAll();
          break;
        }
        case WorkspaceCommands.PUSH: {
          const ws = new WorkspaceService({ wsRoot });
          await ws.pushVaults();
          break;
        }
        case WorkspaceCommands.REMOVE_CACHE: {
          const ws = new WorkspaceService({ wsRoot });
          await ws.removeVaultCaches();
          this.print("caches removed");
          break;
        }
        case WorkspaceCommands.SYNC: {
          const ws = new WorkspaceService({ wsRoot });
          this.print("commit and add...");
          await ws.commitAndAddAll();
          this.print("pull...");
          await ws.pullVaults();
          this.print("push...");
          await ws.pushVaults();
          this.print("done...");
          break;
        }
        default: {
          throw Error("bad option");
        }
      }
      return { error: undefined };
    } catch (err: any) {
      this.L.error(err);
      return { error: err };
    } finally {
      if (opts.server.close) {
        opts.server.close();
      }
    }
  }
}
