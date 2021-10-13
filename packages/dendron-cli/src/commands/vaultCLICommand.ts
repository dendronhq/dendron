import { WorkspaceService } from "@dendronhq/engine-server";
import { DendronError, DVault, VaultRemoteSource } from "@dendronhq/common-all";
import yargs from "yargs";
import { CLICommand, CommandCommonProps } from "./base";
import { setupEngine, setupEngineArgs, SetupEngineResp } from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
  vault?: string;
  enginePort?: number;
  vaultPath: string;
  noAddToConfig?: boolean;
  cmd: VaultCommands;
  remoteUrl?: string;
  type?: VaultRemoteSource;
};

type CommandOpts = CommandCLIOpts & SetupEngineResp & CommandCommonProps;

export enum VaultCommands {
  CREATE = "create",
  CONVERT = "convert",
}

export { CommandOpts as VaultCLICommandOpts };

export class VaultCLICommand extends CLICommand<CommandOpts> {
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
    args.option("remoteUrl", {
      describe:
        "If converting to a remote vault, URL of the remote to use. Like https://github.com/dendronhq/dendron-site.git or git@github.com:dendronhq/dendron-site.git",
      type: "string",
    });
    args.option("type", {
      describe: "If converting a vault, what type of vault to convert it to.",
      type: "string",
      choices: ["remote", "local"],
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
          const resp = await wsService.createVault({
            vault,
            noAddToConfig,
            addToCodeWorkspace: true,
          });
          this.print(`${vaultPath} created`);
          return { vault: resp, error: undefined };
        }
        case VaultCommands.CONVERT: {
          // Find the full vault object because convert commands will need it to correctly edit `dendron.yml`
          const vault = opts.engine.vaults.find(
            (vault) => vault.fsPath === vaultPath
          );
          if (!vault)
            throw new DendronError({
              message: `Could not find any vaults at ${vaultPath}`,
            });
          const wsService = new WorkspaceService({ wsRoot });
          if (opts.type === "local") {
            wsService.convertVaultLocal({ wsRoot, vault });
          } else if (opts.type === "remote") {
            const { remoteUrl } = opts;
            if (!remoteUrl)
              throw new DendronError({
                message: "Trying to convert to a remote vault, but the ",
              });
            wsService.convertVaultRemote({ wsRoot, vault, remoteUrl });
          } else {
            throw new DendronError({
              message: `Please provide what type of vault should be created.`,
            });
          }

          return { vault, error: undefined };
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
