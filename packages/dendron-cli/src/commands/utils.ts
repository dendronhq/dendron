import { resolvePath } from "@dendronhq/common-server";
import { DEngineClientV2, EngineConnector } from "@dendronhq/engine-server";
import { LaunchEngineServerCommand } from "./launchEngineServer";

export async function setupEngine(opts: {
  wsRoot: string;
  enginePort?: number;
}) {
  let { wsRoot, enginePort } = opts;
  let engine: DEngineClientV2;
  let port: number;
  wsRoot = resolvePath(wsRoot, process.cwd());
  if (enginePort) {
    const engineConnector = EngineConnector.getOrCreate({
      wsRoot,
    });
    await engineConnector.init({ portOverride: enginePort });
    engine = engineConnector.engine;
    port = enginePort;
  } else {
    ({ engine, port } = await new LaunchEngineServerCommand().enrichArgs(opts));
  }
  return { wsRoot, engine, port };
}
