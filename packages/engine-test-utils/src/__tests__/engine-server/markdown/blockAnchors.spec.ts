import { ConfigService, ConfigUtils, URI } from "@dendronhq/common-all";
import { AssertUtils, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import { Parent, Text } from "@dendronhq/engine-server";
import {
  BlockAnchor,
  DendronASTDest,
  DendronASTTypes,
  MDUtilsV5,
  UnistNode,
} from "@dendronhq/unified";
import _ from "lodash";
import { TestConfigUtils } from "../../..";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { TestUnifiedUtils } from "../../../utils";
import { createProcForTest, createProcTests, ProcTests } from "./utils";

const { getDescendantNode } = TestUnifiedUtils;

function proc() {
  return MDUtilsV5.procRemarkParseNoData({}, { dest: DendronASTDest.HTML });
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
        preSetupHook: async (opts) => {
          await testCase.preSetupHook(opts);
          await TestConfigUtils.withConfig(
            (config) => {
              const defaultConfig = ConfigUtils.genDefaultConfig();
              ConfigUtils.setVaults(
                defaultConfig,
                ConfigUtils.getVaults(config)
              );
              return defaultConfig;
            },
            { wsRoot: opts.wsRoot }
          );
        },
      });
    });
  });
}

function getBlockAnchor(node: UnistNode): BlockAnchor {
  return getDescendantNode<BlockAnchor>(expect, node, 0, 0);
}

describe("blockAnchors", () => {
  describe("parse", () => {
    test("parses anchor by itself", () => {
      const resp = proc().parse("^block-0-id");
      expect(getBlockAnchor(resp).type).toEqual(DendronASTTypes.BLOCK_ANCHOR);
      expect(getBlockAnchor(resp).id).toEqual("block-0-id");
    });

    test("doesn't parse inline code block", () => {
      const resp = proc().parse("`^block-id`");
      expect(getBlockAnchor(resp).type).toEqual("inlineCode");
    });

    test("doesn't parse block anchor inside a link", async () => {
      const resp = proc().parse("[[#^block-id]]");
      expect(getBlockAnchor(resp).type).toEqual(DendronASTTypes.WIKI_LINK);
    });

    test("parses a block anchor in the middle of a paragraph", async () => {
      const resp = proc().parse(
        ["Lorem ipsum ^block-id", "dolor amet."].join("\n")
      );
      expect(getDescendantNode(expect, resp, 0, 1).type).toEqual(
        DendronASTTypes.BLOCK_ANCHOR
      );
    });

    test("doesn't parse code block not at the end of the line", async () => {
      const resp = proc().parse("^block-id Lorem ipsum");
      expect(getDescendantNode(expect, resp, 0, 0).type).toEqual("text");
      expect(
        getDescendantNode<Parent>(expect, resp, 0).children.length
      ).toEqual(1); // text only, nothing else
    });

    test("parses anchors at the end of the line", () => {
      const resp = proc().parse("Lorem ipsum ^block-id");
      const text = getDescendantNode(expect, resp, 0, 0);
      expect(text.type).toEqual("text");
      const anchor = getDescendantNode<BlockAnchor>(expect, resp, 0, 1);
      expect(anchor.type).toEqual(DendronASTTypes.BLOCK_ANCHOR);
      expect(anchor.id).toEqual("block-id");
    });

    test("parses anchors at the end of headers", () => {
      const resp = proc().parse("# Lorem ipsum ^block-id");
      const header = getDescendantNode<Text>(expect, resp, 0, 0);
      expect(header.value.trim()).toEqual("Lorem ipsum");
      const anchor = getDescendantNode<BlockAnchor>(expect, resp, 0, 1);
      expect(anchor.type).toEqual(DendronASTTypes.BLOCK_ANCHOR);
      expect(anchor.id).toEqual("block-id");
    });

    test("doesn't parse footnote as block anchor", async () => {
      const resp = proc().parse("Lorem ipsum [^footnote]");
      expect(getDescendantNode(expect, resp, 0, 1).type).toEqual(
        "footnoteReference"
      );
    });
  });

  describe("rendering", () => {
    const anchor = "^my-block-anchor-0";
    const SIMPLE = createProcTests({
      name: "simple",
      setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        const proc2 = await createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          config,
        });
        const resp = await proc2.process(anchor);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: ["<a", `href="#${anchor}"`, `id="${anchor}"`, "</a>"],
                nomatch: ["visibility: hidden"],
              }),
              expected: true,
            },
          ];
        },
        [DendronASTDest.MD_DENDRON]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: [anchor],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const END_OF_PARAGRAPH = createProcTests({
      name: "end of paragraph",
      setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        const proc2 = await createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          config,
        });
        const resp = await proc2.process(`Lorem ipsum dolor amet ${anchor}`);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: ["<a", `href="#${anchor}"`, `id="${anchor}"`, "</a>"],
                nomatch: ["visibility: hidden"],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const AFTER_CODE_BLOCK = createProcTests({
      name: "after code block",
      setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        const proc2 = await createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          config,
        });
        const resp = await proc2.process(
          ["```", "const x = 1;", "```", "", anchor].join("\n")
        );
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: ["<a", `href="#${anchor}"`, `id="${anchor}"`, "</a>"],
                nomatch: ["visibility: hidden"],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const AFTER_TABLE = createProcTests({
      name: "after table",
      setupFunc: async ({ engine, vaults, extra, wsRoot }) => {
        const config = (
          await ConfigService.instance().readConfig(URI.file(wsRoot))
        )._unsafeUnwrap();
        const proc2 = await createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
          config,
        });

        const p = proc2.parse(
          [
            "| t   | a   |",
            "| --- | --- |",
            "| c   | d   |",
            "",
            `${anchor}`,
          ].join("\n")
        );
        const n = await proc2.run(p);
        const resp = proc2.stringify(n);
        return { resp };
      },
      verifyFuncDict: {
        [DendronASTDest.HTML]: async ({ extra }) => {
          const { resp } = extra;
          expect(resp).toMatchSnapshot();
          return [
            {
              actual: await AssertUtils.assertInString({
                body: resp.toString(),
                match: ["<a", `href="#${anchor}"`, `id="${anchor}"`, "</a>"],
                nomatch: ["visibility: hidden"],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const ALL_TEST_CASES = [
      ...SIMPLE,
      ...END_OF_PARAGRAPH,
      ...AFTER_CODE_BLOCK,
      ...AFTER_TABLE,
    ];
    runAllTests({ name: "compile", testCases: ALL_TEST_CASES });
  });
});
