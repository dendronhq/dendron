import {
  DendronError,
  DendronConfig,
  RespV3,
  ConfigService,
} from "@dendronhq/common-all";

export class ConfigController {
  static singleton?: ConfigController;

  static instance() {
    if (!ConfigController.singleton) {
      ConfigController.singleton = new ConfigController();
    }
    return ConfigController.singleton;
  }

  async get(): Promise<RespV3<DendronConfig>> {
    try {
      const configReadResult = await ConfigService.instance().readConfig();
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
