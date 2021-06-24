import { createLogger, findUpTo, resolvePath } from "@dendronhq/common-server";
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
} & LaunchEngineServerCLIOpts;

export type SetupEngineResp = {
  wsRoot: string;
  engine: DEngineClient;
  port: number;
  server: any;
};

export type SetupEngineOpts = {
  wsRoot: string;
  engine: DEngineClient;
  port?: number;
  server: any;
};

const createDummyServer = () => ({
  close: () => {},
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
  let server: any;
  wsRoot = resolvePath(wsRoot, process.cwd());
  if (useLocalEngine) {
    const engine = DendronEngineV2.create({ wsRoot, logger });
    await engine.init();
    return { wsRoot, engine, port: -1, server: createDummyServer() };
  }
  if (enginePort) {
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
    port = enginePort;
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
  args.option("useLocalEngine", {
    type: "boolean",
    describe: "If set, use in memory engine instead of connecting to a server",
  });
}
