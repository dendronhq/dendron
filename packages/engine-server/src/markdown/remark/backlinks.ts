import { NoteUtilsV2 } from "@dendronhq/common-all";
import { MDUtilsV4 } from "@dendronhq/engine-server";
import { link as mdastLink } from "mdast-builder";
import Unified, { Plugin } from "unified";
var u = require("unist-builder");

const plugin: Plugin = function(this: Unified.Processor) {
  const proc = this;
  function transformer(tree) {
    const { fname, vault } = MDUtilsV4.getDendronData(proc);
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtilsV2.getNotesByFname({
      fname: fname!,
      notes: engine.notes,
      vault: vault
    });

    // show backlinks at the end of the page if they exist
    if (note[0].links.length > 0) {
      tree.children.push(u("heading", { depth: 2 }, [u("text", "Backlinks")]));
      let backlinks = [];
      console.log(note[0].links, "links");
      console.log(tree, "tree");
      console.log(mdastLink, "link");
      note[0].links.map(link => {
        if (link.type === "backlink" && link.from.fname) {
          // backlinks.push(listItem(text(link.value)))
          // TODO: should be right url
          tree.children.push(mdastLink(link.from.fname, link.from.fname));
          // backlinks.push(listItem(mdastLink("test", link.from.fname)));
        }
      });
      console.log(tree, "tree after");
      // TODO: fix types
      // tree.children.push(list("unordered", backlinks));
    }
  }
  return transformer;
};

export { plugin as backlinks };
