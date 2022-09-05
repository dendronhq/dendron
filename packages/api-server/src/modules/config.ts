import {
  DendronError,
  IntermediateDendronConfig,
  RespV2,
  WorkspaceRequest,
} from "@dendronhq/common-all";
import { DConfig } from "@dendronhq/common-server";
import { MemoryStore } from "../store/memoryStore";
import { getWSEngine } from "../utils";

export class ConfigController {
  static singleton?: ConfigController;

  static instance() {
    if (!ConfigController.singleton) {
      ConfigController.singleton = new ConfigController();
    }
    return ConfigController.singleton;
  }

  async get({
    ws,
  }: WorkspaceRequest): Promise<RespV2<IntermediateDendronConfig>> {
    const engine = ws
      ? await getWSEngine({ ws })
      : MemoryStore.instance().getEngine();
    try {
      const config = DConfig.readConfigSync(engine.wsRoot);
      return { data: config, error: null };
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }

  async write({
    ws,
    ...opts
  }: WorkspaceRequest & IntermediateDendronConfig): Promise<RespV2<void>> {
    const engine = ws
      ? await getWSEngine({ ws })
      : MemoryStore.instance().getEngine();
    await DConfig.writeConfig({ wsRoot: engine.wsRoot, config: opts });
    return { error: null };
  }
}
