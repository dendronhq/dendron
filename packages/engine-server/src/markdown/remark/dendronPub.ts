import { NoteUtilsV2 } from "@dendronhq/common-all";
import { Image } from "mdast";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { DendronASTDest, NoteRefDataV4, WikiLinkNoteV4 } from "../types";
import { MDUtilsV4 } from "../utils";
import { convertNoteRefAST, NoteRefsOpts } from "./noteRefs";
import { addError, getNoteOrError } from "./utils";

type PluginOpts = NoteRefsOpts & {
  assetsPrefix?: string;
};

function plugin(this: Unified.Processor, opts?: PluginOpts): Transformer {
  const proc = this;
  const { dest, vault } = MDUtilsV4.getDendronData(proc);
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, _idx, parent) => {
      if (
        node.type === "wikiLink" &&
        dest !== DendronASTDest.MD_ENHANCED_PREVIEW
      ) {
        let _node = node as WikiLinkNoteV4;
        let value = node.value as string;
        const data = _node.data;
        const { error, engine } = MDUtilsV4.getEngineFromProc(proc);
        if (error) {
          addError(proc, error);
        }

        const copts = opts?.wikiLinkOpts;
        if (copts?.useId) {
          // TODO: check for vault
          const notes = NoteUtilsV2.getNotesByFname({
            fname: value,
            notes: engine.notes,
            vault,
          });
          const { error, note } = getNoteOrError(notes, value);
          if (error) {
            addError(proc, error);
          } else {
            value = note!.id;
          }
        }
        const alias = data.alias ? data.alias : value;
        const href = `${copts?.prefix || ""}${value}.html${
          data.anchorHeader ? "#" + data.anchorHeader : ""
        }`;
        const exists = true;
        // for rehype
        //_node.value = newValue;
        _node.value = alias;
        _node.data = {
          alias,
          permalink: href,
          exists: exists,
          hName: "a",
          hProperties: {
            // className: classNames,
            href,
          },
          hChildren: [
            {
              type: "text",
              value: alias,
            },
          ],
        };
      }
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
