import { Image } from "mdast";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { DendronASTDest } from "../types";
import { MDUtilsV4 } from "../utils";

type TransformerOpts = {
  assetsPrefix?: string;
};

type PluginOpts = TransformerOpts;

function plugin(this: Unified.Processor, opts?: TransformerOpts): Transformer {
  const proc = this;
  const { dest } = MDUtilsV4.getDendronData(proc);
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node) => {
      if (node.type === "image" && dest === DendronASTDest.HTML) {
        let imageNode = node as Image;
        if (opts?.assetsPrefix) {
          imageNode.url = opts.assetsPrefix + imageNode.url;
        }
      }
    });
    return tree;
  }
  return transformer;
}

export { plugin as dendronPub };
export { PluginOpts as DendronPubOpts };
