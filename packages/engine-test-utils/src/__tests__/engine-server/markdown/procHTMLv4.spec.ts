import { ConfigUtils } from "@dendronhq/common-all";
import { MDUtilsV4 } from "@dendronhq/engine-server";
import { TestConfigUtils } from "../../../config";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { checkString } from "../../../utils";

describe("GIVEN procHTMLv4", () => {
  describe("WHEN assetPrefix", () => {
    describe("AND WHEN stage is prod", () => {
      test("THEN show link with prefix", async () => {
        process.env["BUILD_STAGE"] = "prod";
        await runEngineTestV5(
          async ({ engine, vaults }) => {
            const vault = vaults[0];
            const fname = "foo";
            const config = engine.config;
            const noteIndex = engine.notes["bar"];
            const resp = await MDUtilsV4.procHTML({
              engine,
              vault,
              fname,
              config,
              mermaid: ConfigUtils.getProp(config, "mermaid"),
              noteIndex,
            }).process(`[[an alias|bar]]`);
            await checkString(
              resp.contents as string,
              `<li><a href="https://foo.com/customPrefix/notes/foo.ch1.html">Ch1</a></li>`
            );
          },
          {
            preSetupHook: async (opts) => {
              await ENGINE_HOOKS.setupBasic(opts);
              TestConfigUtils.withConfig(
                (config) => {
                  // procHTML is still in v4 config. (but never used elsewhere)
                  config.version = 4;
                  config.site = {
                    siteHierarchies: ["root"],
                    siteRootDir: "docs",
                  };
                  config.site.siteUrl = "https://foo.com";
                  config.site.assetsPrefix = "/customPrefix";
                  config.site.siteNotesDir = "notes";
                  return config;
                },
                { wsRoot: opts.wsRoot }
              );
            },
            expect,
          }
        );
      });
    });
  });
});
