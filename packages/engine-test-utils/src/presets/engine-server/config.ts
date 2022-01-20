import { CONSTANTS, ConfigUtils } from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import path from "path";

function genDefaultConfig() {
  return ConfigUtils.genDefaultConfig();
}

const WRITE = {
  NEW_CONFIG: new TestPresetEntryV4(async ({ engine }) => {
    const config = genDefaultConfig();
    ConfigUtils.setPublishProp(config, "copyAssets", false);
    const resp = await engine.writeConfig({ config });
    const cpath = path.join(engine.configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
    const configOnFile = readYAML(cpath);
    return [
      {
        actual: resp.error,
        expected: null,
      },
      {
        actual: configOnFile,
        expected: config,
      },
    ];
  }),
};

const GET = {
  DEFAULT_CONFIG: new TestPresetEntryV4(async ({ engine }) => {
    const cpath = path.join(engine.configRoot, CONSTANTS.DENDRON_CONFIG_FILE);
    writeYAML(cpath, genDefaultConfig());
    const resp = await engine.getConfig();
    return [
      {
        actual: resp.error,
        expected: null,
      },
      {
        actual: resp.data,
        expected: genDefaultConfig(),
      },
    ];
  }),
};

export const ENGINE_CONFIG_PRESETS = {
  WRITE,
  GET,
};
