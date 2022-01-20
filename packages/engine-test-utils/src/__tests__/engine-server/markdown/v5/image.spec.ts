import { ConfigUtils, VaultUtils } from "@dendronhq/common-all";
import { DendronASTDest, ProcFlavor } from "@dendronhq/engine-server";
import { TestConfigUtils } from "../../../..";
import { ENGINE_HOOKS } from "../../../../presets";
import { checkString } from "../../../../utils";
import { createProcCompileTests } from "../utils";
import { getOpts, runTestCases } from "./utils";
import fs from "fs-extra";
import path from "path";

describe("GIVEN image link", () => {
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

  describe("WHEN enablePreviewDirectImage is set", () => {
    runTestCases(
      createProcCompileTests({
        name: "ENABLE_PREVIEW_DIRECT_IMAGE_SET",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const txt = `![](/assets/images/test.png)`;
          const resp = await proc.process(txt);
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.PREVIEW]: async ({ extra }) => {
              const { resp } = extra;
              await checkString(resp.contents, `src="data:image/png;base64,`);
            },
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
          // Add an image to the workspace
          const imagePath = path.join(
            opts.wsRoot,
            VaultUtils.getRelPath(opts.vaults[0]),
            "assets",
            "images"
          );
          await fs.ensureDir(imagePath);
          // Add a small image PNG image file to test with. Direct image proc needs to read an actual image file.
          await fs.writeFile(
            path.join(imagePath, "test.png"),
            Buffer.from(
              // A 4px x 4px green square
              "iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAASSURBVBhXYwjZHgFHRHG2RwAAQPIWMeBpwLoAAAAASUVORK5CYII=",
              "base64"
            )
          );
          TestConfigUtils.withConfig(
            (config) => {
              const dev = ConfigUtils.getDev(config);
              dev.enablePreviewDirectImage = true;
              ConfigUtils.setDev(config, dev);
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      })
    );
  });
});
