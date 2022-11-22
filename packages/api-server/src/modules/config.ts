import {
  DendronError,
  DendronConfig,
  RespV3,
  ConfigService,
  WorkspaceRequest,
  URI,
} from "@dendronhq/common-all";
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

  async get({ ws }: WorkspaceRequest): Promise<RespV3<DendronConfig>> {
    const engine = ws
      ? await getWSEngine({ ws })
      : MemoryStore.instance().getEngine();
    try {
      const configReadResult = await ConfigService.instance().readConfig(
        URI.file(engine.wsRoot)
      );
      if (configReadResult.isErr()) {
        throw configReadResult.error;
      }
      return { data: configReadResult.value };
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
      };
    }
  }
}
