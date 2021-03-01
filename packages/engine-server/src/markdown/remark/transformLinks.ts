import { DNoteLoc } from "@dendronhq/common-all";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { DendronASTTypes, NoteRefNoteV4, WikiLinkNoteV4 } from "../types";

type PluginOpts = {
  from: DNoteLoc;
  to: DNoteLoc;
};

/**
 * Used from renaming wikilinks
 */
function plugin(this: Unified.Processor, opts: PluginOpts): Transformer {
  // @ts-ignore
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, _idx, _parent) => {
      if (node.type === "wikiLink") {
        let cnode = node as WikiLinkNoteV4;
        if (cnode.value === opts.from.fname) {
          cnode.value = opts.to.fname;
          // if alias the same, change that to
          if (
            cnode.data.alias.toLowerCase() === opts.from.fname.toLowerCase()
          ) {
            cnode.data.alias = opts.to.fname;
          }
        }
      }
      if (node.type === DendronASTTypes.REF_LINK_V2) {
        let cnode = node as NoteRefNoteV4;
        if (cnode.data.link.from.fname === opts.from.fname) {
          cnode.data.link.from.fname = opts.to.fname;
        }
      }
    });
    return tree;
  }
  return transformer;
}

export { plugin as transformLinks };
export { PluginOpts as TransformLinkOpts };
