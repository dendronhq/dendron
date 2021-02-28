import { NoteUtilsV2, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Content, Root } from "mdast";
import { list, listItem, paragraph } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import { DendronASTDest, WikiLinkNoteV4 } from "../types";
import { MDUtilsV4 } from "../utils";

// Plugin that adds backlinks at the end of each page if they exist
const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  function transformer(tree: Node): void {
    let root = tree as Root;
    const { fname, vault, dest } = MDUtilsV4.getDendronData(proc);
    if (!fname) {
      return;
    }
    if (dest !== DendronASTDest.HTML) {
      return;
    }
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtilsV2.getNoteByFnameV5({
      fname: fname,
      notes: engine.notes,
      vault: vault!,
      wsRoot: engine.wsRoot,
    });

    const backlinks = _.uniqBy(
      (note?.links || []).filter((ent) => ent.type === "backlink"),
      (ent) => ent.from.fname + (ent.from.vault?.fsPath || "")
    );

    if (!_.isEmpty(backlinks)) {
      root.children.push({
        type: "thematicBreak",
      });
      root.children.push(u("heading", { depth: 2 }, [u("text", "Backlinks")]));
      root.children.push(
        list(
          "unordered",
          backlinks.map((mdLink) => {
            return listItem(
              paragraph({
                type: "wikiLink",
                value: mdLink.from.fname,
                data: {
                  alias:
                    mdLink.from.fname +
                    (engine.vaultsv3.length > 1
                      ? ` (${VaultUtils.getName(mdLink.from.vault!)})`
                      : ""),
                  vaultName: VaultUtils.getName(mdLink.from.vault!),
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

export { plugin as backlinks };
