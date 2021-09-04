import {
  ConfigGetPayload,
  ConfigWriteOpts,
  DendronError,
  RespV2,
  WorkspaceRequest,
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

  async get({ ws }: WorkspaceRequest): Promise<RespV2<ConfigGetPayload>> {
    const engine = ws
      ? await getWSEngine({ ws })
      : MemoryStore.instance().getEngine();
    try {
      const resp = await engine.getConfig();
      return resp;
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
  }: WorkspaceRequest & ConfigWriteOpts): Promise<RespV2<void>> {
    const engine = ws
      ? await getWSEngine({ ws })
      : MemoryStore.instance().getEngine();
    try {
      const resp = await engine.writeConfig(opts);
      return resp;
    } catch (err) {
      return {
        error: new DendronError({ message: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }
}
