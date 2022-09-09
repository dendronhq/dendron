import { ConfigUtils, NoteDictsUtils, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Content, Root } from "mdast";
import { list, listItem, paragraph } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import { SiteUtils } from "../SiteUtils";
import { DendronASTDest, DendronASTTypes, WikiLinkNoteV4 } from "../types";
import { MDUtilsV5 } from "../utilsv5";

// Plugin that adds backlinks at the end of each page if they exist
// eslint-disable-next-line func-names
const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  function transformer(tree: Node): void {
    const root = tree as Root;
    const {
      fname,
      dest,
      insideNoteRef,
      config,
      noteToRender,
      noteCacheForRenderDict,
      vaults,
      wsRoot,
    } = MDUtilsV5.getProcData(proc);

    // Don't show backlinks for the following cases:
    // - we are inside a note ref
    // - the destination isn't HTML
    // - the note can't be found
    // - enableChild links is toggled off
    // - enableBackLinks is set to false
    if (!fname || insideNoteRef) {
      return;
    }
    if (dest !== DendronASTDest.HTML) {
      return;
    }
    const note = noteToRender;
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

    let backlinksToPublish = _.uniqBy(
      (note?.links || []).filter((ent) => ent.type === "backlink"),
      (ent) => ent.from.fname + (ent.from.vaultName || "")
    );

    // filter out invalid backlinks
    backlinksToPublish = _.filter(backlinksToPublish, (backlink) => {
      const vaultName = backlink.from.vaultName!;
      const vault = VaultUtils.getVaultByName({
        vaults,
        vname: vaultName,
      })!;

      if (!noteCacheForRenderDict) {
        return false;
      }

      const note = NoteDictsUtils.findByFname(
        backlink.from.fname!,
        noteCacheForRenderDict,
        vault
      )[0];

      // if note doesn't exist, don't include in backlinks
      if (!note) {
        return false;
      }
      // if note exists but it can't be published, don't include
      const out = SiteUtils.canPublish({
        note,
        config,
        wsRoot,
        vaults,
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

            const notes = NoteDictsUtils.findByFname(
              mdLink.from.fname!,
              noteCacheForRenderDict!,
              VaultUtils.getVaultByName({
                vaults,
                vname: mdLink.from.vaultName!,
              })
            );

            const note = notes[0];

            if (note) {
              alias =
                note.title +
                (vaults && vaults.length > 1
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
