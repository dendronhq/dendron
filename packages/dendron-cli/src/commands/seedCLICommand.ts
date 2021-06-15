import { assertUnreachable, SeedCommands } from "@dendronhq/common-all";
import _ from "lodash";
import yargs from "yargs";
import { SeedRegistry } from "../seeds";
import { CLICommand } from "./base";
import {
  setupEngine,
  setupEngineArgs,
  SetupEngineCLIOpts,
  SetupEngineOpts,
} from "./utils";

type CommandCLIOpts = {
  wsRoot: string;
  vault?: string;
  cmd: SeedCommands;
  id: string;
};

type CommandOpts = CommandCLIOpts & SetupEngineOpts & {};

type CommandOutput = any;

export { CommandOpts as SeedCLICommandOpts };

export class SeedCLICommand extends CLICommand<CommandOpts, CommandOutput> {
  constructor() {
    super({ name: "seed <cmd> <id>", desc: "seed bank related commands" });
  }

  buildArgs(args: yargs.Argv) {
    super.buildArgs(args);
    setupEngineArgs(args);
    args.positional("cmd", {
      describe: "a command to run",
      choices: Object.values(SeedCommands),
      type: "string",
    });
    args.positional("id", {
      describe: "id of seed",
      type: "string",
    });
  }

  async enrichArgs(args: CommandCLIOpts): Promise<CommandOpts> {
    const engineOpts: SetupEngineCLIOpts = { ...args, init: false };
    const engineArgs = await setupEngine(engineOpts);
    return { ...args, ...engineArgs };
  }

  async execute(opts: CommandOpts) {
    const { cmd, id } = opts;
    const registry = SeedRegistry.create();
    const ctx = "execute";
    this.L.info({ ctx, id });
    try {
      switch (cmd) {
        case SeedCommands.INFO:
          const resp = registry.info({ id });
          if (_.isUndefined(resp)) {
            this.print(`${id} is not in seed bank`);
          } else {
            this.print(JSON.stringify(resp, null, 4));
          }
          return resp;
        default:
          assertUnreachable();
      }
    } catch (err) {
      this.L.error(err);
      throw err;
    } finally {
      if (opts.server.close) {
        opts.server.close();
      }
    }
  }
}
