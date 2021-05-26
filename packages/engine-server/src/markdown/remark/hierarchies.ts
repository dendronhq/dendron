import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Content, Root } from "mdast";
import { list, listItem, paragraph } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import { SiteUtils } from "../../topics/site";
import { HierarchyUtils } from "../../utils";
import { DendronASTDest, WikiLinkNoteV4, DendronASTTypes } from "../types";
import { MDUtilsV4 } from "../utils";

type PluginOpts = {
  hierarchyDisplayTitle?: string;
  hierarchyDisplay?: boolean;
};

const plugin: Plugin = function (this: Unified.Processor, opts?: PluginOpts) {
  const proc = this;
  const hierarchyDisplayTitle = opts?.hierarchyDisplayTitle || "Children";
  const hierarchyDisplay = _.isUndefined(opts?.hierarchyDisplay)
    ? true
    : opts?.hierarchyDisplay;

  function transformer(tree: Node): void {
    let root = tree as Root;
    const { fname, vault, dest, config, insideNoteRef } =
      MDUtilsV4.getDendronData(proc);
    if (!fname || insideNoteRef) {
      return;
    }
    if (dest !== DendronASTDest.HTML) {
      return;
    }
    if (!hierarchyDisplay) {
      return;
    }

    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtils.getNoteOrThrow({
      fname: fname,
      notes: engine.notes,
      vault: vault!,
      wsRoot: engine.wsRoot,
    });
    // don't include if collection present
    if (note.children.length <= 0 || note.custom?.has_collection) {
      return;
    }
    if (
      _.isBoolean(note.custom?.hierarchyDisplay) &&
      !note.custom.hierarchyDisplay
    ) {
      return;
    }
    const children = HierarchyUtils.getChildren({
      skipLevels: note.custom?.skipLevels || 0,
      note,
      notes: engine.notes,
    })
      .filter((note) => SiteUtils.canPublish({ note, engine, config }))
      .filter(
        (note) =>
          _.isUndefined(note.custom?.nav_exclude) || !note.custom?.nav_exclude
      );

    if (!_.isEmpty(children)) {
      root.children.push({
        type: "thematicBreak",
      });
      root.children.push(
        u(DendronASTTypes.HEADING, { depth: 2 }, [
          u("text", hierarchyDisplayTitle),
        ])
      );
      root.children.push(
        list(
          "ordered",
          _.sortBy(children, ["custom.nav_order", "title"]).map((note) => {
            return listItem(
              paragraph({
                type: DendronASTTypes.WIKI_LINK,
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
export { PluginOpts as HierarchiesOpts };
