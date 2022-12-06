import { Server } from "@dendronhq/api-server";
import { createLogger, resolvePath } from "@dendronhq/common-server";
import {
  DendronEngineV2,
  DendronEngineV3,
  DEngineClient,
  EngineConnector,
  EngineConnectorTarget,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { Socket } from "net";
import yargs from "yargs";
import {
  LaunchEngineServerCLIOpts,
  LaunchEngineServerCommand,
} from "./launchEngineServer";

export type SetupEngineCLIOpts = {
  enginePort?: number;
  useLocalEngine?: boolean;
  attach?: boolean;
  target?: EngineConnectorTarget;
  newEngine?: boolean;
} & LaunchEngineServerCLIOpts;

export type SetupEngineResp = {
  wsRoot: string;
  engine: DEngineClient;
  port: number;
  server: Server;
  serverSockets?: Set<Socket>;
};

export type SetupEngineOpts = {
  wsRoot: string;
  engine: DEngineClient;
  port?: number;
  server: any;
};

/**
 * used by {@link setupEngine}.
 * Depending on options passed, we create a mock {@link Server}
 * with a compatible API
 * @param closeServer
 * @returns
 */
const createDummyServer = (closeServer?: () => Promise<void>) =>
  ({
    close: (cb: () => void) => {
      if (closeServer) {
        closeServer().then(cb);
        return;
      } else {
        return cb();
      }
    },
  } as Server);

/**
 * Setup an engine based on CLI args
 */
export async function setupEngine(
  opts: SetupEngineCLIOpts
): Promise<SetupEngineResp> {
  const logger = createLogger();
  const { enginePort, init, useLocalEngine, newEngine } = _.defaults(opts, {
    init: true,
    useLocalEngine: false,
  });
  let engine: DEngineClient;
  let port: number;
  let server: Server;
  let serverSockets = new Set<Socket>();
  const wsRoot = resolvePath(opts.wsRoot, process.cwd());
  const ctx = "setupEngine";

  // instead of spwaning an engine in a separate process, create one
  // in memory
  if (useLocalEngine) {
    const engine = newEngine
      ? DendronEngineV3.create({ wsRoot, logger })
      : DendronEngineV2.create({ wsRoot, logger });
    const out = await engine.init();
    if (out.error) {
      // eslint-disable-next-line no-console
      console.error(out.error);
    }
    return {
      wsRoot,
      engine,
      port: -1,
      server: createDummyServer(),
      serverSockets: new Set(),
    };
  }

  // connect to a running engine at specified port
  if (enginePort) {
    logger.info({
      ctx,
      msg: "connecting to engine at port",
      enginePort,
      init,
    });
    const engineConnector = EngineConnector.getOrCreate({
      wsRoot,
    });
    await engineConnector.init({
      portOverride: enginePort,
      init,
    });
    engine = engineConnector.engine;
    port = enginePort;
    // the server is running somewhere else
    // we need a dummy server because the calling function
    // will try to close the server
    server = createDummyServer();
    return { wsRoot, engine, port, server, serverSockets };
  }

  if (opts.attach) {
    logger.info({
      ctx,
      msg: "connecting to running engine",
      attach: opts.attach,
      init,
    });
    const engineConnector = EngineConnector.getOrCreate({
      wsRoot,
    });
    await engineConnector.init({
      init,
      target: opts.target,
    });
    engine = engineConnector.engine;
    port = engineConnector.port!;
    if (engineConnector.serverPortWatcher) {
      // a file watcher is created when engine port is undefined
      // needs to be cleaned up on server closing
      server = createDummyServer(async () => {
        engineConnector.serverPortWatcher?.close();
      });
    } else {
      server = createDummyServer();
    }
    return { wsRoot, engine, port, server, serverSockets };
  }

  // if not using current engine, initialize a new one
  logger.info({ ctx, msg: "initialize new engine" });
  const resp = await new LaunchEngineServerCommand().enrichArgs(opts);
  ({ engine, port, server, serverSockets } = resp.data);
  if (init) {
    const out = await engine.init();
    // eslint-disable-next-line no-console
    if (out.error) console.error(out.error);
  }
  return { wsRoot, engine, port, server, serverSockets };
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
    describe: "Use existing engine instead of spawning a new one",
  });
  args.option("useLocalEngine", {
    type: "boolean",
    describe: "If set, use in memory engine instead of connecting to a server",
  });
}
