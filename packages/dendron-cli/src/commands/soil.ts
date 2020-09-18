import { DEngine } from "@dendronhq/common-all";
import { resolvePath } from "@dendronhq/common-server";
import { DendronEngine } from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import { BaseCommand } from "./base";

type CommandOpts = {
  engine: DEngine;
  wsRoot: string;
};

type CommandCLIOpts = {
  wsRoot: string;
  vault: string;
};

export { CommandCLIOpts as SoilCommandCLIOpts };
export { CommandOpts as SoilCommandOpts };

// @ts-ignore
export abstract class SoilCommand<
  TCLIOpts extends CommandCLIOpts = CommandCLIOpts,
  TCommandOpts extends CommandOpts = CommandOpts,
  TCommandOutput = void
> extends BaseCommand<TCommandOpts, TCommandOutput> {
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

  abstract enrichArgs(args: TCLIOpts): TCommandOpts;

  eval = (args: TCLIOpts) => {
    const opts = this.enrichArgs(args);
    return opts.engine.init().then(() => {
      return this.execute(opts);
    });
  };

  _enrichArgs(args: TCLIOpts): CommandOpts {
    let { vault, wsRoot } = args;
    const engine = DendronEngine.getOrCreateEngine({
      root: vault,
      forceNew: true,
    });

    const cwd = process.cwd();
    wsRoot = resolvePath(wsRoot, cwd);
    vault = resolvePath(vault, cwd);
    return {
      ...args,
      engine,
      wsRoot,
    };
  }
}
