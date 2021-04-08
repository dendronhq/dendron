import { DVault, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import yargs from "yargs";
import { CLICommand } from "./base";
import { setupEngine, setupEngineArgs, SetupEngineResp } from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
  vault?: string;
  enginePort?: number;
  query?: string;
  cmd: NoteCommands;
};

type CommandOpts = CommandCLIOpts & SetupEngineResp & {};

type CommandOutput = any;

export enum NoteCommands {
  LOOKUP = "lookup",
}

export { CommandOpts as NoteCLICommandOpts };

export class NoteCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({ name: "note <cmd>", desc: "note related commands" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.positional("cmd", {
      describe: "a command to run",
      choices: ["lookup"],
      type: "string",
    });
    // args.option("action", {
    //   describe: "what action to perform on notes",
    //   type: "string",
    //   requiresArg: true,
    //   choices: Object.values(NoteActions),
    // });
    args.option("query", {
      describe: "the query to run",
      type: "string",
    });
    // args.option("limit", {
    //   describe: "limit num changes",
    //   type: "number",
    // });
    // args.option("dryRun", {
    //   describe: "dry run",
    //   type: "boolean",
    // });
    // args.option("filter", {
    //   describe: "filter operations",
    //   type: "array",
    // });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineArgs = await setupEngine(args);
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts) {
    const { cmd, engine } = opts;
    const vaults = opts.engine.vaultsv3;

    try {
      switch (cmd) {
        case NoteCommands.LOOKUP: {
          let vault: DVault;
          if (!opts.query) {
            throw Error("no query found");
          }
          if (_.size(opts.engine.vaultsv3) > 1 && !opts.vault) {
            throw Error("need to specify vault");
          } else {
            vault = opts.vault
              ? VaultUtils.getVaultByNameOrThrow({ vaults, vname: opts.vault })
              : vaults[0];
          }
          const { data } = await engine.getNoteByPath({
            npath: opts.query,
            createIfNew: true,
            vault,
          });
          this.print(JSON.stringify(data, null, 4));
          return data;
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
