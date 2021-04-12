import { WorkspaceService } from "@dendronhq/engine-server";
import { DVault } from "@dendronhq/common-all";
import yargs from "yargs";
import { CLICommand } from "./base";
import { setupEngine, setupEngineArgs, SetupEngineResp } from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
  vault?: string;
  enginePort?: number;
  vaultPath: string;
  noAddToConfig?: boolean;
  cmd: VaultCommands;
};

type CommandOpts = CommandCLIOpts & SetupEngineResp & {};

type CommandOutput = any;

export enum VaultCommands {
  CREATE = "create",
}

export { CommandOpts as VaultCLICommandOpts };

export class VaultCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({ name: "vault <cmd>", desc: "vault related commands" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.positional("cmd", {
      describe: "a command to run",
      choices: Object.values(VaultCommands),
      type: "string",
    });
    args.option("vaultPath", {
      describe: "path to vault",
      type: "string",
      required: true,
    });
    args.option("noAddToConfig", {
      describe: "if set, don't add vault to dendron.yml",
      type: "boolean",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineArgs = await setupEngine(args);
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts) {
    const { cmd, wsRoot, vaultPath, noAddToConfig } = opts;

    try {
      switch (cmd) {
        case VaultCommands.CREATE: {
          //const vault = checkAndCleanVault({ vaultName: opts.vault, engine });
          const vault: DVault = {
            fsPath: vaultPath,
          };
          const wsService = new WorkspaceService({ wsRoot });
          return await wsService.createVault({ vault, noAddToConfig });
        }
        default: {
          throw Error("bad option");
        }
      }
    } finally {
      if (opts.server.close) {
        opts.server.close();
      }
    }
  }
}
