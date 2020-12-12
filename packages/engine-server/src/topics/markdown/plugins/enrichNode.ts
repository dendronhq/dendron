import { DendronError } from "@dendronhq/common-all";
import { NoteUtilsV2 } from "@dendronhq/common-all";
import _ from "lodash";
import Unified, { Transformer } from "unified";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { EngineConnector } from "../../connector";
import {
  DendronASTData,
  DendronASTDest,
  DendronASTTypes,
  WikiLinkNote,
} from "./types";

function wikiNode2HTML(node: WikiLinkNote) {
  if (_.isUndefined(node.notes)) {
    return new DendronError({ msg: `no note found for node: ${node}` });
  }
  if (node.notes.length > 1) {
    return new DendronError({ msg: `multiple notes found for link: ${node}` });
  }
  if (node.notes.length < 1) {
    return new DendronError({
      msg: `no notes found for link: ${JSON.stringify(node)}`,
    });
  }
  const note = node.notes[0];
  const href = `${node.data.prefix || ""}${note.id}.html`;
  node.data.hProperties.href = href;
  return;
}

export function enrichNode(this: Unified.Processor): Transformer {
  return async (tree, _file: VFile) => {
    const proc = this;
    // const engine = proc.data("engine") as EngineConnector;
    const data = proc.data("dendron") as DendronASTData;

    const engine = EngineConnector.instance();
    if (!engine.initialized) {
      console.log("init engine");
      await engine.init({ portOverride: 3006 });
      proc().data("engine", engine);
    }

    visit(tree, DendronASTTypes.WIKI_LINK, (node: WikiLinkNote) => {
      // add data to node
      const fname = NoteUtilsV2.normalizeFname(node.value);
      const notes = NoteUtilsV2.getNotesByFname({
        fname,
        notes: engine.engine.notes,
      });
      node.notes = notes;
      // transform note for HTML
      switch (data.dest) {
        case DendronASTDest.HTML: {
          const err = wikiNode2HTML(node);
          if (err) {
            const errors = proc.data("errors") as DendronError[];
            errors.push(err);
            proc().data("errors", errors);
          }
          break;
        }
        default:
          // DO NOTHING
          break;
      }
      return true;
    });
  };
}
