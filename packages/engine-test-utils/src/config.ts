import { DConfig } from "@dendronhq/engine-server";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import { DendronConfig } from "@dendronhq/common-all";

export class TestConfigUtils {
  static getConfig = (opts: { wsRoot: string }) => {
    const configPath = DConfig.configPath(opts.wsRoot);
    const config = readYAML(configPath) as DendronConfig;
    return config;
  };

  static withConfig = (
    func: (config: DendronConfig) => DendronConfig,
    opts: { wsRoot: string }
  ) => {
    const config = TestConfigUtils.getConfig(opts);

    const newConfig = func(config);
    TestConfigUtils.writeConfig({ config: newConfig, wsRoot: opts.wsRoot });
    return newConfig;
  };

  static writeConfig = (opts: { config: DendronConfig; wsRoot: string }) => {
    const configPath = DConfig.configPath(opts.wsRoot);
    return writeYAML(configPath, opts.config);
  };
}
