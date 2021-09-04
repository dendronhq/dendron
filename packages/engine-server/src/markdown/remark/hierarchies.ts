import { NoteUtils, VaultUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Content, Root } from "mdast";
import { heading, list, listItem, paragraph, text } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import { SiteUtils } from "../../topics/site";
import { HierarchyUtils } from "../../utils";
import { DendronASTDest, WikiLinkNoteV4, DendronASTTypes } from "../types";
import { MDUtilsV4 } from "../utils";
import { frontmatterTag2WikiLinkNoteV4 } from "./utils";

type PluginOpts = {
  hierarchyDisplayTitle?: string;
  hierarchyDisplay?: boolean;
};

/** Adds the "Children" and "Tags" items to the end of the note. */
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
    const note = NoteUtils.getNoteByFnameV5({
      fname: fname,
      notes: engine.notes,
      vault: vault!,
      wsRoot: engine.wsRoot,
    });

    let addedBreak = false;
    function addBreak() {
      if (addedBreak) return;
      root.children.push({
        type: "thematicBreak",
      });
      addedBreak = true;
    }

    /** Add frontmatter tags, if any, ahead of time. This way wikilink compiler will pick them up and render them. */
    function addTags() {
      if (
        config?.site?.showFrontMatterTags !== false &&
        note?.tags &&
        note.tags.length > 0
      ) {
        addBreak();
        root.children.push(heading(2, text("Tags")) as Content);
        const tags = _.isString(note.tags) ? [note.tags] : note.tags;
        const tagLinks = _.sortBy(
          _.map(tags, (tag) =>
            listItem(paragraph(frontmatterTag2WikiLinkNoteV4(tag)))
          ),
          ["custom.nav_order", "title"]
        );
        root.children.push(list("ordered", tagLinks) as Content);
      }
    }

    function addChildren() {
      // don't include if collection present
      if (!note || note.children.length <= 0 || note?.custom?.has_collection) {
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
        addBreak();
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
    }

    // Will appear on page in this order
    addChildren();
    addTags();

    // end transformer
  }
  return transformer;
};

export { plugin as hierarchies };
export { PluginOpts as HierarchiesOpts };
