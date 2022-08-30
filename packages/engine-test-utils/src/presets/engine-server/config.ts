import { CONSTANTS, ConfigUtils } from "@dendronhq/common-all";
import { DConfig, readYAML, writeYAML } from "@dendronhq/common-server";
import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import path from "path";

function genDefaultConfig() {
  return ConfigUtils.genDefaultConfig();
}

const WRITE = {
  NEW_CONFIG: new TestPresetEntryV4(async ({ wsRoot }) => {
    const config = genDefaultConfig();
    ConfigUtils.setPublishProp(config, "copyAssets", false);
    await DConfig.writeConfig({ wsRoot, config });
    const cpath = path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE);
    const configOnFile = readYAML(cpath);
    return [
      {
        actual: configOnFile,
        expected: config,
      },
    ];
  }),
};

const GET = {
  DEFAULT_CONFIG: new TestPresetEntryV4(async ({ wsRoot }) => {
    const cpath = path.join(wsRoot, CONSTANTS.DENDRON_CONFIG_FILE);
    writeYAML(cpath, genDefaultConfig());
    const config = DConfig.readConfigSync(wsRoot);
    return [
      {
        actual: config,
        expected: genDefaultConfig(),
      },
    ];
  }),
};

export const ENGINE_CONFIG_PRESETS = {
  WRITE,
  GET,
};
