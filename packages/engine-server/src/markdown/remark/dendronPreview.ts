import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import { Image } from "mdast";
import path from "path";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { DendronASTTypes } from "../types";
import { MDUtilsV5 } from "../utilsv5";
import { NoteRefsOpts } from "./noteRefs";

type PluginOpts = NoteRefsOpts & {};

function handleImage(proc: Unified.Processor, node: Image) {
  // ignore web images
  if (_.some(["http://", "https://"], (ent) => node.url.startsWith(ent))) {
    return;
  }
  if (node.url.startsWith("/")) {
    const { wsRoot, vault } = MDUtilsV5.getProcData(proc);
    node.url = path.join(vault2Path({ vault, wsRoot }), node.url);
    return;
  }
}

function plugin(this: Unified.Processor, _opts?: PluginOpts): Transformer {
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, _index, _parent) => {
      switch (node.type) {
        case DendronASTTypes.IMAGE:
          return handleImage(proc, node as Image);
        default:
          // no action
          break;
      }
    });
  }
  return transformer;
}
export { plugin as dendronPreview };
export { PluginOpts as DendronPreviewOpts };
