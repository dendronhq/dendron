import { AssertUtils, TestPresetEntryV4, getDescendantNode } from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  DendronASTTypes,
  HashTag,
  MDUtilsV5,
  ProcMode,
  UnistNode,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { createProcForTest, createProcTests, ProcTests } from "./utils";

function proc() {
  return MDUtilsV5.procRehypeParse({
    mode: ProcMode.NO_DATA,
  });
}

function runAllTests(opts: { name: string; testCases: ProcTests[] }) {
  const { name, testCases } = opts;
  describe(name, () => {
    test.each(
      testCases.map((ent) => [`${ent.dest}: ${ent.name}`, ent.testCase])
    )("%p", async (_key, testCase: TestPresetEntryV4) => {
      await runEngineTestV5(testCase.testFunc, {
        expect,
        preSetupHook: testCase.preSetupHook,
      });
    });
  });
}


function getHashtag(node: UnistNode): HashTag {
  return getDescendantNode<HashTag>(node, 0, 0);
}

describe("hashtag", () => {
  describe("parse", () => {
    test("parses basic hashtag", () => {
      const resp = proc().parse("#my-hash-tag");
      expect(getHashtag(resp).type).toEqual(DendronASTTypes.HASHTAG);
      expect(getHashtag(resp).fname).toEqual("tags.my-hash-tag");
    });

    test("parses hashtag with hierarchy", () => {
      const resp = proc().parse("#my.hash.tag0");
      expect(getHashtag(resp).type).toEqual(DendronASTTypes.HASHTAG);
      expect(getHashtag(resp).fname).toEqual("tags.my.hash.tag0");
    });

    test("doesn't parse hashtag inside inline code block", () => {
      const resp = proc().parse("`#my-hash-tag`");
      expect(getHashtag(resp).type).toEqual("inlineCode");
    });

    test("doesn't parse hash inside a link", () => {
      const resp = proc().parse("[[#my-hash-tag]]");
      expect(getHashtag(resp).type).toEqual(DendronASTTypes.WIKI_LINK);
    });

    test("parses a hashtag in the middle of a paragraph", () => {
      const resp = proc().parse(
        "Lorem ipsum #my-hash-tag dolor amet."
      );
      expect(getDescendantNode(resp, 0, 1).type).toEqual(
        DendronASTTypes.HASHTAG
      );
    });

    test("doesn't parse hashtag starting with number", () => {
      const resp = proc().parse("#123-hash-tag");
      expect(getDescendantNode(resp, 0, 0).type).toEqual(DendronASTTypes.TEXT);
    });
  });

  describe("rendering", () => {
    const hashtag = "#my-hash.tag0";
    
    const SIMPLE = createProcTests({
      name: "simple",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(hashtag);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [hashtag],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const ALL_TEST_CASES = [...SIMPLE];
    runAllTests({ name: "compile", testCases: ALL_TEST_CASES });
  });
});
