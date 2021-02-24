import { NoteUtilsV2 } from "@dendronhq/common-all";
import { MDUtilsV4 } from "@dendronhq/engine-server";
import { link, paragraph, text } from "mdast-builder";
import Unified, { Plugin } from "unified";
import u from "unist-builder";

// Plugin that adds backlinks at the end each page if they exist
const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  function transformer(tree) {
    const { fname, vault } = MDUtilsV4.getDendronData(proc);
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtilsV2.getNotesByFname({
      fname: fname!,
      notes: engine.notes,
      vault: vault,
    });

    if (note[0].links.length > 0) {
      tree.children.push(u("heading", { depth: 2 }, [u("text", "Backlinks")]));

      let backlinks = [];
      note[0].links.map((mdLink) => {
        if (mdLink.type === "backlink" && mdLink.from.fname) {
          backlinks.push(
            paragraph(
              link(mdLink.from.fname, undefined, text(mdLink.from.fname))
            )
          );
        }
      });
      tree.children.push(paragraph(backlinks));
    }
  }
  return transformer;
};

export { plugin as backlinks };
