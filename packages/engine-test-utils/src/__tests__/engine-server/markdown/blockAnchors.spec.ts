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
});
