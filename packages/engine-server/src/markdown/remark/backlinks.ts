import {
  ConfigUtils,
  DEngineClient,
  DVault,
  IntermediateDendronConfig,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Content, Root } from "mdast";
import { list, listItem, paragraph } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import { SiteUtils } from "../../topics/site";
import { DendronASTDest, DendronASTTypes, WikiLinkNoteV4 } from "../types";
import { MDUtilsV4 } from "../utils";
import { MDUtilsV5 } from "../utilsv5";

// Plugin that adds backlinks at the end of each page if they exist
// eslint-disable-next-line func-names
const plugin: Plugin = function (this: Unified.Processor) {
  const proc = this;
  function transformer(tree: Node): void {
    const root = tree as Root;
    let fname: string;
    let vault: DVault;
    let dest: DendronASTDest;
    let insideNoteRef: boolean | undefined;
    let config: IntermediateDendronConfig;
    let engine: DEngineClient;

    if (MDUtilsV5.isV5Active(proc)) {
      ({ fname, vault, dest, insideNoteRef, config, engine } =
        MDUtilsV5.getProcData(proc));
    } else {
      ({ fname, vault, dest, insideNoteRef, config } =
        MDUtilsV4.getDendronData(proc));
      engine = MDUtilsV4.getEngineFromProc(proc).engine;
    }

    // Don't show backlinks for the following cases:
    // - we are inside a note ref
    // - the destination isn't HTML
    // - the note can't be found
    // - neableChild links is toggled off
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
    if (ConfigUtils.getEnableBackLinks(config, { note }) === false) {
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
      const note = NoteUtils.getNoteByFnameFromEngine({
        fname: backlink.from.fname!,
        engine,
        vault,
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
