import { Server } from "@dendronhq/api-server";
import { createLogger, resolvePath } from "@dendronhq/common-server";
import {
  DendronEngineV2,
  DEngineClient,
  EngineConnector,
} from "@dendronhq/engine-server";
import _ from "lodash";
import yargs from "yargs";
import {
  LaunchEngineServerCLIOpts,
  LaunchEngineServerCommand,
} from "./launchEngineServer";

export type SetupEngineCLIOpts = {
  enginePort?: number;
  useLocalEngine?: boolean;
  attach?: boolean;
} & LaunchEngineServerCLIOpts;

export type SetupEngineResp = {
  wsRoot: string;
  engine: DEngineClient;
  port: number;
  server: Server;
};

export type SetupEngineOpts = {
  wsRoot: string;
  engine: DEngineClient;
  port?: number;
  server: any;
};

const createDummyServer = () => ({
  close: (cb: any) => cb(),
});
/**
 * Setup an engine based on CLI args
 */
export async function setupEngine(
  opts: SetupEngineCLIOpts
): Promise<SetupEngineResp> {
  const logger = createLogger();
  let { wsRoot, enginePort, init, useLocalEngine } = _.defaults(opts, {
    init: true,
    useLocalEngine: false,
  });
  let engine: DEngineClient;
  let port: number;
  let server: Server;
  wsRoot = resolvePath(wsRoot, process.cwd());
  if (useLocalEngine) {
    const engine = DendronEngineV2.create({ wsRoot, logger });
    await engine.init();
    return { wsRoot, engine, port: -1, server: createDummyServer() };
  }
  if (enginePort || opts.attach) {
    logger.info({
      ctx: "setupEngine",
      msg: "connecting to engine",
      enginePort,
    });
    const engineConnector = EngineConnector.getOrCreate({
      wsRoot,
    });
    await engineConnector.init({ portOverride: enginePort });
    engine = engineConnector.engine;
    if (enginePort) {
      port = enginePort;
    } else {
      // TODO: don't use type assertion
      port = engineConnector.port!;
    }
    server = createDummyServer();
  } else {
    logger.info({ ctx: "setupEngine", msg: "initialize new engine" });
    ({ engine, port, server } =
      await new LaunchEngineServerCommand().enrichArgs(opts));
    if (init) {
      await engine.init();
    }
  }
  return { wsRoot, engine, port, server };
}

/**
 * Add yargs based options to setup engine
 */
export function setupEngineArgs(args: yargs.Argv) {
  args.option("enginePort", {
    describe:
      "If set, connect to to running engine. If not set, create new instance of Dendron Engine",
  });
  args.option("attach", {
    describe: "Use existing engine instead of spwaning a new one",
  });
  args.option("useLocalEngine", {
    type: "boolean",
    describe: "If set, use in memory engine instead of connecting to a server",
  });
}
