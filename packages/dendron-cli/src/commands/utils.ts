import { createLogger, resolvePath } from "@dendronhq/common-server";
import { DEngineClientV2, EngineConnector } from "@dendronhq/engine-server";
import { LaunchEngineServerCommand } from "./launchEngineServer";
import _ from "lodash";
import yargs from "yargs";
const logger = createLogger();

export async function setupEngine(opts: {
  wsRoot: string;
  enginePort?: number;
  init?: boolean;
}): Promise<any> {
  let { wsRoot, enginePort, init } = _.defaults(opts, { init: true });
  let engine: DEngineClientV2;
  let port: number;
  let server: any;
  wsRoot = resolvePath(wsRoot, process.cwd());
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
    // dummy
    server = {
      close: () => {},
    };
  } else {
    logger.info({ ctx: "setupEngine", msg: "initialize new engine" });
    ({
      engine,
      port,
      server,
    } = await new LaunchEngineServerCommand().enrichArgs(opts));
    if (init) {
      await engine.init();
    }
  }
  return { wsRoot, engine, port, server };
}

export function setupEngineArgs(args: yargs.Argv) {
  args.option("enginePort", {
    describe:
      "If set, connecto to running engine. If not set, create new instance of Dendron Engine",
  });
}
