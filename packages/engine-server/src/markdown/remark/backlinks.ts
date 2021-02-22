import { NoteUtilsV2 } from "@dendronhq/common-all";
import { MDUtilsV4 } from "@dendronhq/engine-server";
import Unified, { Plugin } from "unified";
var u = require("unist-builder");

const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  // attachParser(proc)
  function transformer(tree) {
    const { fname, vault } = MDUtilsV4.getDendronData(proc);
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtilsV2.getNotesByFname({
      fname: fname!,
      notes: engine.notes,
      vault: vault,
    });

    // show backlinks at the end of the page if they exist
    if (note[0].links.length > 0) {
      tree.children.push(u("heading", { depth: 2 }, [u("text", "Backlinks")]));
      note[0].links.map((link) => {
        if (link.type === "wiki") {
          tree.children.push(u("text", link.value));
        }
      });
    }
  }
  return transformer;
};

export { plugin as backlinks };
