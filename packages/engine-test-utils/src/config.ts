import { ConfigService, DendronConfig } from "@dendronhq/common-all";

export class TestConfigUtils {
  static getConfig = async () => {
    const config = (
      await ConfigService.instance().readConfig()
    )._unsafeUnwrap();
    return config;
  };

  static withConfig = async (
    func: (config: DendronConfig) => DendronConfig
  ) => {
    const config = await TestConfigUtils.getConfig();

    const newConfig = func(config);
    await TestConfigUtils.writeConfig({
      config: newConfig,
    });
    return newConfig;
  };

  static writeConfig = async (opts: { config: DendronConfig }) => {
    await ConfigService.instance().writeConfig(opts.config);
  };
}
