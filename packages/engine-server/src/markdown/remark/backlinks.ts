import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Content, Root } from "mdast";
import { list, listItem, paragraph } from "mdast-builder";
import { SiteUtils } from "../../topics/site";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import { DendronASTDest, WikiLinkNoteV4, DendronASTTypes } from "../types";
import { MDUtilsV4 } from "../utils";

// Plugin that adds backlinks at the end of each page if they exist
const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  function transformer(tree: Node): void {
    const root = tree as Root;
    const { fname, vault, dest, insideNoteRef } =
      MDUtilsV4.getDendronData(proc);
    if (!fname || insideNoteRef) {
      return;
    }
    if (dest !== DendronASTDest.HTML) {
      return;
    }
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtils.getNoteByFnameV5({
      fname,
      notes: engine.notes,
      vault: vault!,
      wsRoot: engine.wsRoot,
    });
    if (_.isUndefined(note)) {
      return;
    }

    const backlinks = _.uniqBy(
      (note?.links || []).filter((ent) => ent.type === "backlink"),
      (ent) => ent.from.fname + (ent.from.vaultName || "")
    );

    const backlinksToPublish = _.filter(backlinks, (backlink) => {
      const vaultName = backlink.from.vaultName!;
      const vault = VaultUtils.getVaultByName({
        vaults: engine.vaults,
        vname: vaultName,
      })!;
      const note = NoteUtils.getNoteByFnameV5({
        fname: backlink.from.fname!,
        notes: engine.notes,
        vault,
        wsRoot: engine.wsRoot,
      });

      if (!note) {
        return false;
      }
      const out = SiteUtils.canPublish({
        note,
        engine,
        config: engine.config,
      });
      return out;
    });

    if (!_.isEmpty(backlinksToPublish)) {
      root.children.push({
        type: "thematicBreak",
      });
      root.children.push(u("strong", [{ type: "text", value: "Backlinks" }]));
      root.children.push(
        list(
          "unordered",
          backlinksToPublish.map((mdLink) => {
            return listItem(
              paragraph({
                type: DendronASTTypes.WIKI_LINK,
                value: mdLink.from.fname,
                data: {
                  alias:
                    NoteUtils.getNoteOrThrow({
                      fname: mdLink.from.fname!,
                      notes: engine.notes,
                      vault: VaultUtils.getVaultByName({
                        vaults: engine.vaults,
                        vname: mdLink.from.vaultName!,
                      })!,
                      wsRoot: engine.wsRoot,
                    }).title +
                    (engine.vaults.length > 1
                      ? ` (${mdLink.from.vaultName!})`
                      : ""),
                  vaultName: mdLink.from.vaultName!,
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
