import { ConfigUtils, NoteUtils, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Content, Root } from "mdast";
import { list, listItem, paragraph } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import { SiteUtils } from "../../topics/site";
import { DendronASTDest, DendronASTTypes, WikiLinkNoteV4 } from "../types";
import { MDUtilsV5 } from "../utilsv5";

// Plugin that adds backlinks at the end of each page if they exist
// eslint-disable-next-line func-names
const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  function transformer(tree: Node): void {
    const root = tree as Root;
    const { fname, vault, dest, insideNoteRef, config, engine } =
      MDUtilsV5.getProcData(proc);

    // Don't show backlinks for the following cases:
    // - we are inside a note ref
    // - the destination isn't HTML
    // - the note can't be found
    // - neableChild links is toggled off
    // enableBackLinks is set to false
    if (!fname || insideNoteRef) {
      return;
    }
    if (dest !== DendronASTDest.HTML) {
      return;
    }

    const note = NoteUtils.getNoteByFnameFromEngine({ fname, vault, engine });
    if (_.isUndefined(note)) {
      return;
    }

    if (
      ConfigUtils.getEnableBackLinks(config, {
        note,
        shouldApplyPublishingRules: MDUtilsV5.shouldApplyPublishingRules(proc),
      }) === false
    ) {
      return;
    }

    const backlinks = _.uniqBy(
      (note?.links || []).filter((ent) => ent.type === "backlink"),
      (ent) => ent.from.fname + (ent.from.vaultName || "")
    );

    // filter out invalid backlinks
    const backlinksToPublish = _.filter(backlinks, (backlink) => {
      const vaultName = backlink.from.vaultName!;
      const vault = VaultUtils.getVaultByName({
        vaults: engine.vaults,
        vname: vaultName,
      })!;
      const note = NoteUtils.getNoteByFnameFromEngine({
        fname: backlink.from.fname!,
        engine,
        vault,
      });

      // if note doesn't exist, don't include in backlinks
      if (!note) {
        return false;
      }
      // if note exists but it can't be published, don't include
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
            let alias;
            const note = NoteUtils.getNoteByFnameFromEngine({
              fname: mdLink.from.fname!,
              vault: VaultUtils.getVaultByName({
                vaults: engine.vaults,
                vname: mdLink.from.vaultName!,
              })!,
              engine,
            });

            if (note) {
              alias =
                note.title +
                (engine.vaults.length > 1
                  ? ` (${mdLink.from.vaultName!})`
                  : "");
            } else {
              alias = `Unable to find backlinked note ${mdLink.from.fname!}.`;
            }
            return listItem(
              paragraph({
                type: DendronASTTypes.WIKI_LINK,
                value: mdLink.from.fname,
                data: {
                  alias,
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
