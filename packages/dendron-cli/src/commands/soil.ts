import { DEngine } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { BaseCommand } from "./base";

type CommandOpts = {
  engine: DEngine;
  wsRoot: string;
};

type CommandOutput = void;

type CommandCLIOpts = {
  wsRoot: string;
  vault: string;
};

export { CommandCLIOpts as SoilCommandCLIOpts };
export { CommandOpts as SoilCommandOpts };

// @ts-ignore
export abstract class SoilCommand<
  TCLIOpts extends CommandCLIOpts = CommandCLIOpts,
  TCommandOpts = CommandOpts
> extends BaseCommand<TCommandOpts, CommandOutput> {
  buildArgs(args: yargs.Argv) {
    args.option("wsRoot", {
      describe: "location of workspace",
      demandOption: true,
    });
    args.option("vault", {
      describe: "location of vault",
      demandOption: true,
    });
  }

  enrichArgs(args: TCLIOpts): CommandOpts {
    const { vault, wsRoot } = args;
    const engine = DendronEngine.getOrCreateEngine({
      root: vault,
      forceNew: true,
    });
    return {
      ...args,
      engine,
      wsRoot,
    };
  }
}
