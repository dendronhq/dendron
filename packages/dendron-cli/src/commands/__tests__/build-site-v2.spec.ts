import { tmpDir } from "@dendronhq/common-server";
import { ENGINE_HOOKS, runEngineTestV4 } from "@dendronhq/common-test-utils";
import { createEngine } from "@dendronhq/engine-server";
import { ConfigUtils } from "@dendronhq/engine-test-utils";
import { BuildSiteCommandV2 } from "../build-site-v2";

// TODO
describe("basic", () => {
  let siteRootDir: string;
  beforeEach(async () => {
    siteRootDir = tmpDir().name;
  });

  test.skip("basic", async () => {
    await runEngineTestV4(
      async ({ wsRoot }) => {
        const cmd = new BuildSiteCommandV2();
        const resp = await cmd.eval({ wsRoot, stage: "dev", serve: false });
        return resp;
      },
      {
        createEngine,
        expect,
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic(opts);
          await ConfigUtils.writeConfig({
            config: {
              version: 0,
              vaults: opts.vaults,
              site: { siteHierarchies: ["foo", "bar"], siteRootDir },
            },
            wsRoot: opts.wsRoot,
          });
        },
      }
    );
  });
});
