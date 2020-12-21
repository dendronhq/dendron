import {
  ENGINE_HOOKS,
  runEngineTestV4,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import _ from "lodash";
import { DendronASTDest } from "../../types";
import { MDUtilsV4 } from "../../utils";
import { createEngine, createProcTests } from "./utils";

const IMAGE_LINK = `![alt-text](image-url.jpg)`;

const WITH_ASSET_PREFIX_UNDEFINED = createProcTests({
  name: "asset_prefix undefined",
  setupFunc: async ({ engine, vaults, extra }) => {
    const proc = await MDUtilsV4.procFull({
      engine,
      dest: extra.dest,
      vault: vaults[0],
      publishOpts: {
        assetsPrefix: undefined,
      },
    });
    const resp = proc.processSync(IMAGE_LINK);
    return { resp, proc };
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { resp } = extra;
      expect(resp).toMatchSnapshot();
      return [
        {
          actual: _.trim(resp.toString()),
          expected: "![alt-text](image-url.jpg)",
        },
      ];
    },
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { resp } = extra;
      expect(resp).toMatchSnapshot();
      return [
        {
          actual: _.trim(resp.toString()),
          expected: "![alt-text](image-url.jpg)",
        },
      ];
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
      const { resp } = extra;
      return [
        {
          actual: _.trim(resp.toString()),
          expected: "![alt-text](image-url.jpg)",
        },
      ];
    },
  },
  preSetupHook: ENGINE_HOOKS.setupBasic,
});

const WITH_ASSET_PREFIX = createProcTests({
  name: "asset_prefix",
  setupFunc: async ({ engine, vaults, extra }) => {
    const proc = await MDUtilsV4.procFull({
      engine,
      dest: extra.dest,
      vault: vaults[0],
      publishOpts: {
        assetsPrefix: "bond/",
      },
    });
    const resp = proc.processSync(IMAGE_LINK);
    return { resp, proc };
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
      const { resp } = extra;
      expect(resp).toMatchSnapshot();
      return [
        {
          actual: _.trim(resp.toString()),
          expected: "![alt-text](image-url.jpg)",
        },
      ];
    },
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { resp } = extra;
      expect(resp).toMatchSnapshot();
      return [
        {
          actual: _.trim(resp.toString()),
          expected: "![alt-text](bond/image-url.jpg)",
        },
      ];
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
      const { resp } = extra;
      return [
        {
          actual: _.trim(resp.toString()),
          expected: "![alt-text](image-url.jpg)",
        },
      ];
    },
  },
  preSetupHook: ENGINE_HOOKS.setupBasic,
});

const ALL_TEST_CASES = [...WITH_ASSET_PREFIX, ...WITH_ASSET_PREFIX_UNDEFINED];

describe("html dest", () => {
  test.each(
    ALL_TEST_CASES.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
  )("%p", async (_key, testCase: TestPresetEntryV4) => {
    await runEngineTestV4(testCase.testFunc, {
      expect,
      createEngine,
      preSetupHook: testCase.preSetupHook,
    });
  });
});
