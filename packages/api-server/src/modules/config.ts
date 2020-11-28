import {
  ConfigGetPayload,
  ConfigWriteOpts,
  DendronError,
  DEngineClientV2,
  RespV2,
} from "@dendronhq/common-all";
import { WorkspaceRequest } from "@dendronhq/common-server";
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
    const engine = (await getWS({ ws })) as DEngineClientV2;
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
    const engine = (await getWS({ ws })) as DEngineClientV2;
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
