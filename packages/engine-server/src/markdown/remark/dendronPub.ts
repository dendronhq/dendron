import { Image } from "mdast";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { DendronASTDest, NoteRefDataV4 } from "../types";
import { MDUtilsV4 } from "../utils";
import { convertNoteRefAST, NoteRefsOpts } from "./noteRefs";

type PluginOpts = NoteRefsOpts & {
  assetsPrefix?: string;
};

function plugin(this: Unified.Processor, opts?: PluginOpts): Transformer {
  const proc = this;
  const { dest } = MDUtilsV4.getDendronData(proc);
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, _idx, parent) => {
      if (
        node.type === "refLink" &&
        dest !== DendronASTDest.MD_ENHANCED_PREVIEW
      ) {
        const ndata = node.data as NoteRefDataV4;
        const copts: NoteRefsOpts = {
          wikiLinkOpts: opts?.wikiLinkOpts,
          prettyRefs: opts?.prettyRefs,
        };
        const { data } = convertNoteRefAST({
          link: ndata.link,
          proc,
          compilerOpts: copts,
        });
        if (data) {
          parent!.children = data;
        }
      }
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
