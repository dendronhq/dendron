import { AssertUtils, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import {
  DendronASTDest,
  DendronASTTypes,
  UserTag,
  MDUtilsV5,
  ProcMode,
  UnistNode,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { TestConfigUtils } from "../../..";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { TestUnifiedUtils } from "../../../utils";
import {
  checkNotInVFile,
  checkVFile,
  createProcForTest,
  createProcTests,
  ProcTests,
} from "./utils";

const { getDescendantNode } = TestUnifiedUtils;

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
      // @ts-ignore
    )("%p", async (_key, testCase: TestPresetEntryV4) => {
      await runEngineTestV5(testCase.testFunc, {
        expect,
        preSetupHook: testCase.preSetupHook,
      });
    });
  });
}

function getUserTag(node: UnistNode): UserTag {
  return getDescendantNode<UserTag>(expect, node, 0, 0);
}

describe("user tags", () => {
  describe("parse", () => {
    test("parses basic user tag", () => {
      const resp = proc().parse("@Hamilton");
      expect(getUserTag(resp).type).toEqual(DendronASTTypes.USERTAG);
      expect(getUserTag(resp).fname).toEqual("user.Hamilton");
    });

    test("parses user tag with hierarchy", () => {
      const resp = proc().parse("@Hamilton.Margaret");
      expect(getUserTag(resp).type).toEqual(DendronASTTypes.USERTAG);
      expect(getUserTag(resp).fname).toEqual("user.Hamilton.Margaret");
    });

    test("doesn't parse user tag inside inline code block", () => {
      const resp = proc().parse("`@Hamilton.Margaret`");
      expect(getUserTag(resp).type).toEqual("inlineCode");
    });

    test("doesn't parse user tag inside a link", () => {
      const resp = proc().parse("[[@Hamilton.Margaret|some.other.note]]");
      expect(getUserTag(resp).type).toEqual(DendronASTTypes.WIKI_LINK);
    });

    test("parses a user tag in the middle of a paragraph", () => {
      const resp = proc().parse("Lorem ipsum @Hamilton.Margaret dolor amet.");
      expect(getDescendantNode(expect, resp, 0, 1).type).toEqual(
        DendronASTTypes.USERTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp, 0, 1).value).toEqual(
        "@Hamilton.Margaret"
      );
    });

    test("parses user tag with numbers", () => {
      const resp = proc().parse("@7of9");
      expect(getUserTag(resp).type).toEqual(DendronASTTypes.USERTAG);
      expect(getUserTag(resp).value).toEqual("@7of9");
    });

    test("doesn't parse trailing punctuation", () => {
      const resp1 = proc().parse(
        "Dolorem vero sed sapiente @Hamilton.Margaret. Et quam id maxime et ratione."
      );
      expect(getDescendantNode(expect, resp1, 0, 1).type).toEqual(
        DendronASTTypes.USERTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp1, 0, 1).value).toEqual(
        "@Hamilton.Margaret"
      );

      const resp2 = proc().parse(
        "Dolorem vero sed sapiente @Hamilton.Margaret, et quam id maxime et ratione."
      );
      expect(getDescendantNode(expect, resp2, 0, 1).type).toEqual(
        DendronASTTypes.USERTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp2, 0, 1).value).toEqual(
        "@Hamilton.Margaret"
      );
    });

    test("doesn't parse trailing unicode punctuation", () => {
      const resp1 = proc().parse("この人は「@松本.行弘」です。");
      expect(getDescendantNode(expect, resp1, 0, 1).type).toEqual(
        DendronASTTypes.USERTAG
      );
      // @ts-ignore
      expect(getDescendantNode(expect, resp1, 0, 1).value).toEqual(
        "@松本.行弘"
      );
    });

    test("doesn't parse email addresses", () => {
      const resp1 = proc().parse("user@example.com");
      expect(getDescendantNode(expect, resp1, 0, 0).type).toEqual(
        DendronASTTypes.LINK
      );
      expect(getDescendantNode(expect, resp1, 0, 0, 0).type).toEqual(
        DendronASTTypes.TEXT
      );
    });
  });

  describe("rendering", () => {
    const userTag = "@Hamilton.Margaret";

    const SIMPLE = createProcTests({
      name: "simple",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(userTag);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [userTag],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.MD_REGULAR]: async ({ extra }) => {
          const { resp } = extra;
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [`[${userTag}](user.Hamilton.Margaret)`],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.MD_ENHANCED_PREVIEW]: async ({ extra }) => {
          const { resp } = extra;
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [`[${userTag}](user.Hamilton.Margaret.md)`],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            '<a href="user.Hamilton.Margaret">@Hamilton.Margaret</a>'
          );
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const INSIDE_LINK = createProcTests({
      name: "inside a link",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
        });
        const resp = await proc2.process(
          "[@dendronhq](https://twitter.com/dendronhq)"
        );
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          await checkVFile(
            resp,
            '<a href="https://twitter.com/dendronhq">@dendronhq</a>'
          );
          await checkNotInVFile(resp, `Private`);
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const ALL_TEST_CASES = [...SIMPLE, ...INSIDE_LINK];
    runAllTests({ name: "compile", testCases: ALL_TEST_CASES });
  });

  describe("WHEN disabled in config", () => {
    test("THEN user tags don't get parsed or processed", async () => {
      await runEngineTestV5(
        async ({ engine, vaults }) => {
          const proc = MDUtilsV5.procRehypeFull(
            {
              engine,
              vault: vaults[0],
              config: engine.config,
              fname: "root",
            },
            {}
          );
          const out = await proc.process("@test");
          expect(checkVFile(out, "<p>@test</p>"));
          expect(checkNotInVFile(out, "<a", "user.test"));
        },
        {
          expect,
          preSetupHook: async ({ wsRoot }) => {
            TestConfigUtils.withConfig(
              (config) => {
                config.workspace!.enableUserTags = false;
                return config;
              },
              { wsRoot }
            );
          },
        }
      );
    });
  });
});
