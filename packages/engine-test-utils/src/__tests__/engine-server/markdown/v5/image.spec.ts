import { DendronASTDest, ProcFlavor } from "@dendronhq/engine-server";
import { TestConfigUtils } from "../../../..";
import { ENGINE_HOOKS } from "../../../../presets";
import { checkString } from "../../../../utils";
import { createProcCompileTests } from "../utils";
import { getOpts, runTestCases } from "./utils";

describe("GIVEN image link", () => {
  describe("WHEN assetPrefix set", () => {
    runTestCases(
      createProcCompileTests({
        name: "ASSET_PREFIX_SET",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const txt = `![some-image](some-image-link.png)`;
          debugger;
          const resp = await proc.process(txt);
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.PUBLISHING]: async ({ extra }) => {
              const { resp } = extra;
              expect(resp).toMatchSnapshot();
              await checkString(
                resp.contents,
                "/some-prefix/some-image-link.png"
              );
            },
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
          TestConfigUtils.withConfig(
            (config) => {
              config.site.assetsPrefix = "/some-prefix";
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      })
    );
  });
});
