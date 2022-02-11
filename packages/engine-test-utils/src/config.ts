import { DConfig } from "@dendronhq/engine-server";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import { IntermediateDendronConfig } from "@dendronhq/common-all";

export class TestConfigUtils {
  static getConfig = (opts: { wsRoot: string }) => {
    const configPath = DConfig.configPath(opts.wsRoot);
    const config = readYAML(configPath) as IntermediateDendronConfig;
    return config;
  };

  static withConfig = (
    func: (config: IntermediateDendronConfig) => IntermediateDendronConfig,
    opts: { wsRoot: string }
  ) => {
    const config = TestConfigUtils.getConfig(opts);

    const newConfig = func(config);
    TestConfigUtils.writeConfig({ config: newConfig, wsRoot: opts.wsRoot });
    return newConfig;
  };

  static writeConfig = (opts: {
    config: IntermediateDendronConfig;
    wsRoot: string;
  }) => {
    const configPath = DConfig.configPath(opts.wsRoot);
    return writeYAML(configPath, opts.config);
  };
}
