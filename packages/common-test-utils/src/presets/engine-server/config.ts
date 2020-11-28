import { CONSTANTS } from "@dendronhq/common-all";
import { readYAML, writeYAML } from "@dendronhq/common-server";
import path from "path";
import { TestPresetEntryV4 } from "../../utilsv2";

function genDefaultConfig() {
  return {
    version: 1,
    vaults: [],
    site: {
      copyAssets: true,
      siteHierarchies: ["root"],
      siteRootDir: "docs",
      usePrettyRefs: true,
    },
  };
}

const WRITE = {
  NEW_CONFIG: new TestPresetEntryV4(async ({ engine }) => {
    const config = genDefaultConfig();
    config.site.copyAssets = false;
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
