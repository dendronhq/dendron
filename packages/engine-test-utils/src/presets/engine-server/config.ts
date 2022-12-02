import { ConfigUtils, ConfigService, URI } from "@dendronhq/common-all";
import { TestPresetEntryV4 } from "@dendronhq/common-test-utils";

function genDefaultConfig() {
  return ConfigUtils.genDefaultConfig();
}

const WRITE = {
  NEW_CONFIG: new TestPresetEntryV4(async ({ wsRoot }) => {
    const config = genDefaultConfig();
    ConfigUtils.setPublishProp(config, "copyAssets", false);
    const configOnFile = (
      await ConfigService.instance().writeConfig(URI.file(wsRoot), config)
    )._unsafeUnwrap();
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
    const config = (
      await ConfigService.instance().createConfig(URI.file(wsRoot))
    )._unsafeUnwrap();

    return [
      {
        actual: config,
        expected: ConfigUtils.genLatestConfig(),
      },
    ];
  }),
};

export const ENGINE_CONFIG_PRESETS = {
  WRITE,
  GET,
};
