import { NotePropsV2 } from "@dendronhq/common-all";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { DendronASTDest, WikiLinkNoteV4 } from "../types";
import { MDUtilsV4, PublishUtils } from "../utils";

type PluginOpts = {
  noteIndex: NotePropsV2;
};

/**
 * Used when publishing
 * Rewrite index note
 */
function plugin(this: Unified.Processor, opts: PluginOpts): Transformer {
  const proc = this;
  let { dest, config } = MDUtilsV4.getDendronData(proc);
  function transformer(tree: Node, _file: VFile) {
    if (dest !== DendronASTDest.HTML) {
      return;
    }
    visit(tree, (node, _idx, _parent) => {
      if (node.type === "wikiLink") {
        const cnode = node as WikiLinkNoteV4;
        const value = cnode.value;
        const href = PublishUtils.getSiteUrl(config);
        if (value === opts.noteIndex.fname) {
          node.data!.hProperties = { href };
        }
      }
    });
    return tree;
  }
  return transformer;
}

export { plugin as publishSite };
export { PluginOpts as PublishSiteOpts };
