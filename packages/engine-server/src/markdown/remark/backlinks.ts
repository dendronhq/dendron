import { NoteUtilsV2 } from "@dendronhq/common-all";
import { Root } from "mdast";
import { paragraph } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import { MDUtilsV4 } from "../utils";

// Plugin that adds backlinks at the end of each page if they exist
const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  function transformer(tree: Node): void {
    let root = tree as Root;
    const { fname, vault } = MDUtilsV4.getDendronData(proc);
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtilsV2.getNoteByFnameV5({
      fname: fname!,
      notes: engine.notes,
      vault: vault!,
      wsRoot: engine.wsRoot,
    });

    if (note && note.links.length > 0) {
      let backlinks: Node[] = [];
      note.links.map((mdLink) => {
        if (mdLink.type === "backlink" && mdLink.from.fname) {
          backlinks.push(
            paragraph({
              type: "wikiLink",
              value: mdLink.from.fname,
              data: {
                alias: mdLink.from.fname,
                vault: note.vault,
              },
            })
          );
        }
      });
      if (backlinks.length > 0) {
        root.children.push(
          u("heading", { depth: 2 }, [u("text", "Backlinks")])
        );
        root.children.push(paragraph(backlinks));
      }
    }
  }
  return transformer;
};

export { plugin as backlinks };
