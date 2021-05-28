import {
  AssertUtils,
  ENGINE_HOOKS,
  TestPresetEntryV4,
} from "@dendronhq/common-test-utils";
import {
  DendronASTData,
  DendronASTDest,
  DEngineClient,
  MDUtilsV4,
  UnistNode,
  BlockAnchor,
  blockAnchors,
  BlockAnchorOpts,
  DendronASTNode,
} from "@dendronhq/engine-server";
import _ from "lodash";
import { runEngineTestV5 } from "../../../engine";
import { createProcForTest, createProcTests, ProcTests } from "./utils";

function proc(
  engine: DEngineClient,
  dendron: DendronASTData,
  opts?: BlockAnchorOpts
) {
  return MDUtilsV4.proc({ engine })
    .data("dendron", dendron)
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
function getDescendantNode<Child extends DendronASTNode>(
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
      expect(getBlockAnchor(resp).type).toEqual("blockAnchor");
      expect(getBlockAnchor(resp).id).toEqual("block-0-id");
    });

    test("doesn't parse inline code block", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        "`^block-id`"
      );
      expect(getBlockAnchor(resp).type).toEqual("inlineCode");
    });

    test("doesn't parse code block not at the end of the line", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        "^block-id Lorem ipsum"
      );
      expect(getDescendantNode(resp, 0, 0).type).toEqual("text");
      expect(getDescendantNode(resp, 0).children.length).toEqual(1); // text only, nothing else
    });

    test("parses anchors at the end of the line", () => {
      const resp = proc(engine, genDendronData(dendronData)).parse(
        "Lorem ipsum ^block-id"
      );
      const text = getDescendantNode(resp, 0, 0);
      expect(text.type).toEqual("text");
      const anchor = getDescendantNode<BlockAnchor>(resp, 0, 1);
      expect(anchor.type).toEqual("blockAnchor");
      expect(anchor.id).toEqual("block-id");
    });
  });

  describe("rendering", () => {
    const anchor = "^my-block-anchor-0";
    const REGULAR_ANCHOR = createProcTests({
      name: "regular",
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

    const HIDDEN_ANCHOR = createProcTests({
      name: "hidden",
      setupFunc: async ({ engine, vaults, extra }) => {
        const proc2 = createProcForTest({
          engine,
          dest: extra.dest,
          hideBlockAnchors: true,
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
                match: [
                  "<a",
                  `href="#${anchor}"`,
                  "visibility: hidden",
                  `id="${anchor}"`,
                  "</a>",
                ],
              }),
              expected: true,
            },
          ];
        },
      },
      preSetupHook: ENGINE_HOOKS.setupBasic,
    });

    const ALL_TEST_CASES = [...REGULAR_ANCHOR, ...HIDDEN_ANCHOR];
    runAllTests({ name: "compile", testCases: ALL_TEST_CASES });
  });
});
