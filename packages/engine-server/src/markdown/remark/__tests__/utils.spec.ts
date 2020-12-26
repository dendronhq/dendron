import {
  AssertUtils,
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

const NOTE_REF_BASIC_WITH_REHYPE = createProcTests({
  name: "NOTE_REF_WITH_REHYPE",
  setupFunc: async ({ engine, vaults, extra }) => {
    const proc = await MDUtilsV4.procFull({
      engine,
      wikiLinksOpts: { useId: true },
      dest: extra.dest,
      vault: vaults[0],
    });
    const txt = `((ref: [[foo.md]]))`;
    if (extra.dest === DendronASTDest.HTML) {
      const procRehype = MDUtilsV4.procRehype({ proc });
      const resp = await procRehype.process(txt);
      const respParse = await procRehype.parse(txt);
      const respTransform = await procRehype.run(respParse);
      return { resp, proc, respParse, respTransform };
    } else {
      const resp = await proc.process(txt);
      return { resp, proc };
    }
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async () => {},
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { resp, respParse, respTransform } = extra;
      expect(resp).toMatchSnapshot();
      expect(respParse).toMatchSnapshot();
      expect(respTransform).toMatchSnapshot();
      expect(
        await AssertUtils.assertInString({
          body: resp.contents,
          match: [
            // link by id
            `<a href=\"foo-id.html\"`,
            // html quoted
            `<p>foo body</p>`,
          ],
        })
      ).toBeTruthy();
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: async () => {},
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupBasic({ ...opts, extra: { idv2: true } });
  },
});

const NOTE_REF_RECURSIVE_BASIC_WITH_REHYPE = createProcTests({
  name: "NOTE_REF_RECURSIVE_WITH_REHYPE",
  setupFunc: async ({ engine, vaults, extra }) => {
    const proc = await MDUtilsV4.procFull({
      engine,
      wikiLinksOpts: { useId: true },
      dest: extra.dest,
      vault: vaults[0],
    });
    const txt = `((ref: [[foo.md]]))`;
    if (extra.dest === DendronASTDest.HTML) {
      const procRehype = MDUtilsV4.procRehype({ proc });
      const resp = await procRehype.process(txt);
      const respParse = await procRehype.parse(txt);
      const respTransform = await procRehype.run(respParse);
      return { resp, proc, respParse, respTransform };
    } else {
      const resp = await proc.process(txt);
      return { resp, proc };
    }
  },
  verifyFuncDict: {
    [DendronASTDest.MD_REGULAR]: async () => {},
    [DendronASTDest.HTML]: async ({ extra }) => {
      const { resp, respParse, respTransform } = extra;
      expect(resp).toMatchSnapshot();
      expect(respParse).toMatchSnapshot();
      expect(respTransform).toMatchSnapshot();
      expect(
        await AssertUtils.assertInString({
          body: resp.contents,
          match: [
            // link by id
            `<a href=\"foo-id.html\"`,
            // html quoted
            `<h1>Foo.One</h1>`,
            `<h1>Foo.Two</h1>`,
          ],
        })
      ).toBeTruthy();
    },
    [DendronASTDest.MD_ENHANCED_PREVIEW]: async () => {},
  },
  preSetupHook: async (opts) => {
    await ENGINE_HOOKS.setupNoteRefRecursive({
      ...opts,
      extra: { idv2: true },
    });
  },
});

const ALL_TEST_CASES = [
  ...WITH_ASSET_PREFIX,
  ...WITH_ASSET_PREFIX_UNDEFINED,
  ...NOTE_REF_BASIC_WITH_REHYPE,
  ...NOTE_REF_RECURSIVE_BASIC_WITH_REHYPE,
];

describe("MDUtils.proc", () => {
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
