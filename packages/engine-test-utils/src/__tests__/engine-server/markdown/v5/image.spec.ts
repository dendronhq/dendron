import { ConfigUtils } from "@dendronhq/common-all";
import { DendronASTDest, ProcFlavor } from "@dendronhq/unified";
import { TestConfigUtils } from "../../../..";
import { ENGINE_HOOKS } from "../../../../presets";
import { checkNotInString, checkString } from "../../../../utils";
import { createProcCompileTests } from "../utils";
import { getOpts, runTestCases } from "./utils";

describe("GIVEN image link", () => {
  describe("WHEN assetPrefix is NOT set", () => {
    runTestCases(
      createProcCompileTests({
        name: "ASSET_PREFIX_SET",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const txt = `![some-image](some-image-link.png)`;
          const resp = await proc.process(txt);
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.PUBLISHING]: async ({ extra }) => {
              const { resp } = extra;
              expect(resp).toMatchSnapshot();
              await checkString(resp.contents, "/some-image-link.png");
            },
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
        },
      })
    );
  });
  describe("WHEN assetPrefix set", () => {
    runTestCases(
      createProcCompileTests({
        name: "ASSET_PREFIX_SET",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const txt = `![some-image](some-image-link.png)`;
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
              // Make sure to avoid extra slash
              await checkNotInString(resp.contents, "//some-prefix");
            },
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setPublishProp(
                config,
                "assetsPrefix",
                "/some-prefix"
              );
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      })
    );
  });
  describe("WHEN assetPrefix is set and and image url is not local ", () => {
    runTestCases(
      createProcCompileTests({
        name: "REMOTE_IMAGE",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const txt = `![second-image](https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/not-sprouted.png)`;
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
                "https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/not-sprouted.png"
              );
            },
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setPublishProp(
                config,
                "assetsPrefix",
                "/some-prefix"
              );
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      })
    );
  });
});
