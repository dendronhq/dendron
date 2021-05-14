import {
  DendronASTData,
  DendronASTDest,
  DEngineClientV2,
  MDUtilsV4,
  UnistNode,
  BlockAnchor,
  blockAnchors,
  BlockAnchorOpts,
} from "@dendronhq/engine-server";
import _ from "lodash";

function proc(
  engine: DEngineClientV2,
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

function getBlockAnchor(node: UnistNode): BlockAnchor {
  // @ts-ignore
  return node.children[0].children[0];
}

describe("blockAnchors", () => {
  describe("parse", () => {
    let engine: any;
    let dendronData = {
      fname: "placeholder.md",
      dest: DendronASTDest.MD_REGULAR,
    };

    test("basic", () => {
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
  });
});
