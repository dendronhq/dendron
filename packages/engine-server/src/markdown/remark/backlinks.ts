import { NoteUtilsV2 } from "@dendronhq/common-all";
import { MDUtilsV4 } from "@dendronhq/engine-server";
import { Root } from "mdast";
import { paragraph } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";

// Plugin that adds backlinks at the end of each page if they exist
const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  function transformer(tree: Node) {
    let root = tree as Root;
    const { fname, vault } = MDUtilsV4.getDendronData(proc);
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtilsV2.getNotesByFname({
      fname: fname!,
      notes: engine.notes,
      vault: vault,
    });

    if (note[0].links.length > 0) {
      let backlinks: Array<Node> = [];
      note[0].links.map((mdLink) => {
        if (mdLink.type === "backlink" && mdLink.from.fname) {
          backlinks.push(
            paragraph({
              type: "wikiLink",
              value: mdLink.from.fname,
              data: {
                alias: mdLink.from.fname,
                vault: note[0].vault,
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
