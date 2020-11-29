import {
  ConfigGetPayload,
  ConfigWriteOpts,
  DendronError,
  RespV2,
} from "@dendronhq/common-all";
import { WorkspaceRequest } from "@dendronhq/common-server";
import { MemoryStore } from "../store/memoryStore";
import { getWS } from "../utils";

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
      ? await getWS({ ws })
      : MemoryStore.instance().getEngine();
    try {
      const resp = await engine.getConfig();
      return resp;
    } catch (err) {
      return {
        error: new DendronError({ msg: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }

  async write({
    ws,
    ...opts
  }: WorkspaceRequest & ConfigWriteOpts): Promise<RespV2<void>> {
    const engine = ws
      ? await getWS({ ws })
      : MemoryStore.instance().getEngine();
    try {
      const resp = await engine.writeConfig(opts);
      return resp;
    } catch (err) {
      return {
        error: new DendronError({ msg: JSON.stringify(err) }),
        data: undefined,
      };
    }
  }
}
