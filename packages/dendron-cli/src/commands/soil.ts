import { DEngineClientV2 } from "@dendronhq/common-all";
import { resolvePath } from "@dendronhq/common-server";
import { DendronEngineV2, FileStorageV2 } from "@dendronhq/engine-server";
import yargs from "yargs";
import { BaseCommand } from "./base";

type CommandOpts = {
  engineClient: DEngineClientV2;
  wsRoot: string;
};

type CommandOptsV2 = {
  engine: DEngineClientV2;
  wsRoot: string;
  vault: string;
};

export type CommandOptsV3 = {
  engine: DEngineClientV2;
  wsRoot: string;
};

type CommandCLIOpts = {
  wsRoot: string;
  vault: string;
};
type CommandCLIOptsV3 = {
  wsRoot: string;
  vaults: string[];
};

export { CommandCLIOpts as SoilCommandCLIOpts };
export { CommandCLIOptsV3 as SoilCommandCLIOptsV3 };
export { CommandOpts as SoilCommandOpts };
export { CommandOptsV2 as SoilCommandOptsV2 };
export { CommandOptsV3 as SoilCommandOptsV3 };

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
    return opts.engineClient.init().then(() => {
      return this.execute(opts);
    });
  };

  _enrichArgs(args: TCLIOpts): CommandOpts {
    let { vault, wsRoot } = args;

    const logger = this.L;
    const engineClient = new DendronEngineV2({
      vaults: [vault],
      forceNew: true,
      store: new FileStorageV2({ vaults: [vault], logger }),
      mode: "fuzzy",
      logger,
    });

    const cwd = process.cwd();
    wsRoot = resolvePath(wsRoot, cwd);
    vault = resolvePath(vault, cwd);
    return {
      ...args,
      engineClient,
      wsRoot,
    };
  }
}

export abstract class SoilCommandV2<
  TCLIOpts extends CommandCLIOpts = CommandCLIOpts,
  TCommandOpts extends CommandOptsV2 = CommandOptsV2,
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

  /**
   * Take CLI opts and transform them into command opts
   * @param args
   */
  abstract enrichArgs(args: TCLIOpts): TCommandOpts;

  eval = (args: TCLIOpts) => {
    const opts = this.enrichArgs(args);
    return opts.engine.init().then(() => {
      return this.execute(opts);
    });
  };

  _enrichArgs(args: TCLIOpts): CommandOptsV2 {
    let { vault, wsRoot } = args;
    const cwd = process.cwd();
    wsRoot = resolvePath(wsRoot, cwd);
    vault = resolvePath(vault, cwd);
    const logger = this.L;
    const engine = new DendronEngineV2({
      vaults: [vault],
      forceNew: true,
      store: new FileStorageV2({ vaults: [vault], logger }),
      mode: "fuzzy",
      logger,
    });
    return {
      ...args,
      engine,
      wsRoot,
    };
  }
}

export abstract class SoilCommandV3<
  TCLIOpts extends CommandCLIOptsV3 = CommandCLIOptsV3,
  TCommandOpts extends CommandOptsV3 = CommandOptsV3,
  TCommandOutput = void
> extends BaseCommand<TCommandOpts, TCommandOutput> {
  buildArgs(args: yargs.Argv) {
    args.option("wsRoot", {
      describe: "location of workspace",
      demandOption: true,
    });
    args.option("vaults", {
      describe: "location of vault",
      type: "array",
      demandOption: false,
    });
  }

  /**
   * Take CLI opts and transform them into command opts
   * @param args
   */
  abstract enrichArgs(args: TCLIOpts): Promise<TCommandOpts>;

  eval = async (args: TCLIOpts) => {
    const opts = await this.enrichArgs(args);
    return opts.engine.init().then(() => {
      return this.execute(opts);
    });
  };

  // _enrichArgs(args: TCLIOpts): CommandOptsV2 {
  //   let { vault, wsRoot } = args;
  //   const cwd = process.cwd();
  //   wsRoot = resolvePath(wsRoot, cwd);
  //   vault = resolvePath(vault, cwd);
  //   const logger = this.L;
  //   return {
  //     ...args,
  //     engine,
  //     wsRoot,
  //   };
  // }
}
