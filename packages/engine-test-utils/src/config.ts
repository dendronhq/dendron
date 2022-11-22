import { ConfigService, DendronConfig, URI } from "@dendronhq/common-all";

export class TestConfigUtils {
  static getConfig = async (opts: { wsRoot: string }) => {
    const config = (
      await ConfigService.instance().readConfig(URI.file(opts.wsRoot))
    )._unsafeUnwrap();
    return config;
  };

  static withConfig = async (
    func: (config: DendronConfig) => DendronConfig,
    opts: { wsRoot: string }
  ) => {
    const config = await TestConfigUtils.getConfig(opts);

    const newConfig = func(config);
    await TestConfigUtils.writeConfig({
      wsRoot: opts.wsRoot,
      config: newConfig,
    });
    return newConfig;
  };

  static writeConfig = async (opts: {
    config: DendronConfig;
    wsRoot: string;
  }) => {
    await ConfigService.instance().writeConfig(
      URI.file(opts.wsRoot),
      opts.config
    );
  };
}
