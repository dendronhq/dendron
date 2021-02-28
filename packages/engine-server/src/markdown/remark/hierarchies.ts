import { NoteUtilsV2, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Content, Root } from "mdast";
import { list, listItem, paragraph } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import { SiteUtils } from "../../topics/site";
import { DendronASTDest, WikiLinkNoteV4 } from "../types";
import { MDUtilsV4 } from "../utils";

// Plugin that adds backlinks at the end of each page if they exist
const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  function transformer(tree: Node): void {
    let root = tree as Root;
    const { fname, vault, dest, config } = MDUtilsV4.getDendronData(proc);
    if (!fname) {
      return;
    }
    if (dest !== DendronASTDest.HTML) {
      return;
    }
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtilsV2.getNoteOrThrow({
      fname: fname,
      notes: engine.notes,
      vault: vault!,
      wsRoot: engine.wsRoot,
    });
    // don't include if collection present
    if (note.children.length <= 0 || note.custom?.has_collection) {
      return;
    }

    const children = note.children
      .map((id) => engine.notes[id])
      .filter((note) => SiteUtils.canPublish({ note, engine, config }))
      .filter(
        (note) =>
          _.isUndefined(note.custom?.nav_exclude) || !note.custom?.nav_exclude
      );

    if (!_.isEmpty(children)) {
      root.children.push({
        type: "thematicBreak",
      });
      root.children.push(u("heading", { depth: 2 }, [u("text", "Children")]));
      root.children.push(
        list(
          "ordered",
          _.sortBy(children, ["custom.nav_order", "title"]).map((note) => {
            return listItem(
              paragraph({
                type: "wikiLink",
                value: note.fname,
                data: {
                  alias: note.title,
                  vaultName: VaultUtils.getName(note.vault),
                },
                children: [],
              } as WikiLinkNoteV4)
            );
          })
        ) as Content
      );
    }

    // end transformer
  }
  return transformer;
};

export { plugin as hierarchies };
