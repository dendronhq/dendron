import { AssertUtils, TestPresetEntryV4 } from "@dendronhq/common-test-utils";
import {
  BlockAnchor,
  BlockAnchorOpts,
  blockAnchors,
  DendronASTData,
  DendronASTDest,
  DendronASTTypes,
  DEngineClient,
  MDUtilsV4,
  Node,
  Parent,
  Text,
  UnistNode,
  wikiLinks,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import { ENGINE_HOOKS } from "../../../presets";
import { createProcForTest, createProcTests, ProcTests } from "./utils";

function proc(
  engine: DEngineClient,
  dendron: DendronASTData,
  opts?: BlockAnchorOpts
) {
  return MDUtilsV4.proc({ engine })
    .data("dendron", dendron)
    .use(wikiLinks)
    .use(blockAnchors, opts);
}

function genDendronData(opts?: Partial<DendronASTData>): DendronASTData {
  return { ...opts } as any;
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

/** Gets the descendent (child, or child of child...) node of a given node.
 *
 * @param node The root node to start descending from.
 * @param indices Left-to-right indexes for children, e.g. first index is for the root, second is for the child of the root...
 * @returns Requested child. Note that this function has no way of checking types, so the child you get might not be of the right type.
 */
function getDescendantNode<Child extends Node>(
  node: UnistNode,
  ...indices: number[]
): Child {
  const index = indices.shift();
  if (_.isUndefined(index)) return node as Child;
  expect(node).toHaveProperty("children");
  expect(node.children).toHaveProperty("length");
  const children = node.children as UnistNode[];
  expect(children.length).toBeGreaterThanOrEqual(index);
  return getDescendantNode<Child>(children[index], ...indices);
}

function getBlockAnchor(node: UnistNode): BlockAnchor {
  return getDescendantNode<BlockAnchor>(node, 0, 0);
}

describe("blockAnchors", () => {
  describe("parse", () => {
    let engine: any;
    let dendronData = {
      fname: "placeholder.md",
      dest: DendronASTDest.MD_REGULAR,
    };

    test("parses anchor by itself", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        "^block-0-id"
      );
      expect(getBlockAnchor(resp).type).toEqual(DendronASTTypes.BLOCK_ANCHOR);
      expect(getBlockAnchor(resp).id).toEqual("block-0-id");
    });

    test("doesn't parse inline code block", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        "`^block-id`"
      );
      expect(getBlockAnchor(resp).type).toEqual("inlineCode");
    });

    test("doesn't parse block anchor inside a link", async () => {
      const resp = proc(await engine, genDendronData(dendronData)).parse(
        "[[#^block-id]]"
      );
      expect(getBlockAnchor(resp).type).toEqual(DendronASTTypes.WIKI_LINK);
    });

    test("parses a block anchor in the middle of a paragraph", async () => {
      const resp = proc(await engine, genDendronData(dendronData)).parse(
        ["Lorem ipsum ^block-id", "dolor amet."].join("\n")
      );
      expect(getDescendantNode(resp, 0, 1).type).toEqual(
        DendronASTTypes.BLOCK_ANCHOR
      );
    });

    test("doesn't parse code block not at the end of the line", async () => {
      const resp = proc(await engine, genDendronData(dendronData)).parse(
        "^block-id Lorem ipsum"
      );
      expect(getDescendantNode(resp, 0, 0).type).toEqual("text");
      expect(getDescendantNode<Parent>(resp, 0).children.length).toEqual(1); // text only, nothing else
    });

    test("parses anchors at the end of the line", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        "Lorem ipsum ^block-id"
      );
      const text = getDescendantNode(resp, 0, 0);
      expect(text.type).toEqual("text");
      const anchor = getDescendantNode<BlockAnchor>(resp, 0, 1);
      expect(anchor.type).toEqual(DendronASTTypes.BLOCK_ANCHOR);
      expect(anchor.id).toEqual("block-id");
    });

    test("parses anchors at the end of headers", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        "# Lorem ipsum ^block-id"
      );
      const header = getDescendantNode<Text>(resp, 0, 0);
      expect(header.value.trim()).toEqual("Lorem ipsum");
      const anchor = getDescendantNode<BlockAnchor>(resp, 0, 1);
      expect(anchor.type).toEqual(DendronASTTypes.BLOCK_ANCHOR);
      expect(anchor.id).toEqual("block-id");
    });
  });

  describe("rendering", () => {
    const anchor = "^my-block-anchor-0";
    const SIMPLE = createProcTests({
      name: "simple",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
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
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const END_OF_PARAGRAPH = createProcTests({
      name: "end of paragraph",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          vault: vaults[0],
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

    const ALL_TEST_CASES = [...SIMPLE, ...END_OF_PARAGRAPH];
    runAllTests({ name: "compile", testCases: ALL_TEST_CASES });
  });
});
