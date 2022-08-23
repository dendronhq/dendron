import { ConfigUtils } from "@dendronhq/common-all";
import { NoteTestUtilsV4 } from "@dendronhq/common-test-utils";
import { DendronASTDest, ProcFlavor } from "@dendronhq/unified";
import { TestConfigUtils } from "../../../..";
import { ENGINE_HOOKS } from "../../../../presets";
import { checkNotInString, checkString } from "../../../../utils";
import { checkVFile, createProcCompileTests } from "../utils";
import { getOpts, runTestCases } from "./utils";

describe("GIVEN noteRef plugin", () => {
  describe("WHEN note ref missing", () => {
    runTestCases(
      createProcCompileTests({
        name: "NOTE_REF_MISSING",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const txt = `![[alpha.md]]`;
          const resp = await proc.process(txt);
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.REGULAR]: async ({ extra }) => {
              const { resp } = extra;
              await checkString(resp.contents, "No note with name alpha found");
            },
            [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
            [ProcFlavor.PUBLISHING]: ProcFlavor.REGULAR,
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
          const txt = `![[bar.md]]`;
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
                '<iframe src="/data/refs/bar---0.html"></iframe>'
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

  describe("WHEN note ref to html AND prettyLinks = true", () => {
    runTestCases(
      createProcCompileTests({
        name: "NOTE_REF_WITH_REHYPE",
        setup: async (opts) => {
          const { proc } = getOpts(opts);
          const txt = `![[alpha.md]]`;
          const resp = await proc.process(txt);
          return { resp, proc };
        },
        verify: {
          [DendronASTDest.HTML]: {
            [ProcFlavor.REGULAR]: async ({ extra }) => {
              const { resp } = extra;
              expect(resp).toMatchSnapshot();
              await checkVFile(
                resp,
                // should have id for link
                `<a href="alpha-id"`,
                // html quoted
                `<p><a href="bar">Bar</a></p>`
              );
              await checkNotInString(
                resp.contents,
                // should not have title
                `Alpha<h1>`
              );
            },
            [ProcFlavor.PREVIEW]: ProcFlavor.REGULAR,
            [ProcFlavor.PUBLISHING]: async ({ extra }) => {
              const { resp } = extra;
              expect(resp).toMatchSnapshot();
              // maybe check the refs html?
              await checkString(
                resp.contents,
                // should have id for link
                `<iframe src="/data/refs/alpha-id---0.html"></iframe>`
              );
              await checkString(
                resp.contents,
                `<iframe src="/refs/alpha-id---0">`
              );
              /**
               *           const refsDir = MDUtilsV5.getRefsRoot(wsRoot);
          await checkDir({ fpath: refsDir, snapshot: true });
          const refFile = path.join(refsDir, "alpha-id---0.json");
          await checkFile({ fpath: refFile, snapshot: true });
          await checkString(resp.contents, `<iframe src="/refs/alpha-id---0">`);
               */
            },
          },
        },
        preSetupHook: async (opts) => {
          await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
          await NoteTestUtilsV4.createNote({
            fname: "alpha",
            body: "[[bar]]",
            vault: opts.vaults[0],
            wsRoot: opts.wsRoot,
            props: { id: "alpha-id" },
          });
          TestConfigUtils.withConfig(
            (config) => {
              ConfigUtils.setPublishProp(config, "enablePrettyLinks", true);
              return config;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      })
    );
  });
});
