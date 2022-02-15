import {
  ConfigUtils,
  FOOTNOTE_DEF_CLASS,
  FOOTNOTE_REF_CLASS,
  NoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Content, FootnoteDefinition, FootnoteReference, Root } from "mdast";
import { heading, html, list, listItem, paragraph, text } from "mdast-builder";
import Unified, { Plugin } from "unified";
import { Node } from "unist";
import u from "unist-builder";
import visit from "unist-util-visit";
import { SiteUtils } from "../../topics/site";
import { HierarchyUtils } from "../../utils";
import { DendronASTDest, DendronASTTypes, WikiLinkNoteV4 } from "../types";
import { MDUtilsV4 } from "../utils";
import { MDUtilsV5 } from "../utilsv5";
import { frontmatterTag2WikiLinkNoteV4, RemarkUtils } from "./utils";

type PluginOpts = {
  hierarchyDisplayTitle?: string;
  hierarchyDisplay?: boolean;
};

// These are the HTML IDs for footnotes. This replicates what the footnotes plugin was doing.
const FOOTNOTE_DEF_ID_PREFIX = `${FOOTNOTE_DEF_CLASS}-`;
const FOOTNOTE_REF_ID_PREFIX = `${FOOTNOTE_REF_CLASS}-`;
/** The symbol that will be shown as the "return to reference" button. */
const FOOTNOTE_RETURN_SYMBOL = "˄";

function footnote2html(reference: FootnoteReference) {
  return html(
    `<a id="${FOOTNOTE_REF_ID_PREFIX}${reference.identifier}"` +
      `class="${FOOTNOTE_REF_CLASS}"` +
      `href="#${FOOTNOTE_DEF_ID_PREFIX}${reference.identifier}">` +
      (reference.label || reference.identifier) +
      `</a>`
  );
}

function footnoteDef2html(definition: FootnoteDefinition) {
  // Add a back arrow to the end of the definition that takes user to the
  // footnote reference. We have to inject the back arrow into the text inside
  // the definition, otherwise it renders in a different line than the definition.
  const backArrow = html(
    `<a class="${FOOTNOTE_DEF_CLASS}" href="#${FOOTNOTE_REF_ID_PREFIX}${definition.identifier}">${FOOTNOTE_RETURN_SYMBOL}</a>`
  );
  const lastChild = _.last(definition.children);
  if (lastChild && RemarkUtils.isParent(lastChild)) {
    lastChild.children.push(backArrow as any);
  } else {
    // Fallback, not sure if this can actually happen because definition always seems to have a paragraph as a child
    definition.children.push(backArrow as any);
  }
  return paragraph([
    // Put the ID target first, so even if the footnote is multiple lines long, it jumps to the start
    html(
      `<span id="${FOOTNOTE_DEF_ID_PREFIX}${definition.identifier}" style="width: 0; height: 0;"></span>`
    ),
    ...definition.children,
  ]);
}

/** Adds the "Children", "Tags", and "Footnotes" items to the end of the note. Also renders footnotes. */
// eslint-disable-next-line func-names
const plugin: Plugin = function (this: Unified.Processor, opts?: PluginOpts) {
  const proc = this;
  const { config } = MDUtilsV5.getProcData(this);
  // MDUtilsV4 explicitly passes these options in, while MDUtilsV5 relies on the config. We need to check both here for now.
  const hierarchyDisplayTitle =
    opts?.hierarchyDisplayTitle || config?.hierarchyDisplayTitle || "Children";
  let hierarchyDisplay: undefined | boolean = opts?.hierarchyDisplay;
  if (hierarchyDisplay === undefined)
    hierarchyDisplay = config?.hierarchyDisplay;
  if (hierarchyDisplay === undefined) hierarchyDisplay = true;

  function transformer(tree: Node): void {
    const root = tree as Root;
    const { fname, vault, dest, config, insideNoteRef } =
      MDUtilsV4.getDendronData(proc);
    let addedBreak = false;

    if (dest !== DendronASTDest.HTML) {
      return;
    }
    // TODO: remove
    if (!hierarchyDisplay) {
      return;
    }

    function addBreak() {
      if (addedBreak) return;
      root.children.push({
        type: "thematicBreak",
      });
      addedBreak = true;
    }

    function addFootnotes() {
      /** Maps footnote identifiers to their definitions. */
      const footnotes = new Map(
        RemarkUtils.extractFootnoteDefs(root).map((definition) => [
          definition.identifier,
          definition,
        ])
      );
      /** All footnote definitions that have been referenced in this document. */
      const usedFootnotes = new Set<FootnoteDefinition>();
      visit(
        root,
        [DendronASTTypes.FOOTNOTE_REFERENCE],
        (reference: FootnoteReference, index, parent) => {
          const definition = footnotes.get(reference.identifier);
          if (definition && parent) {
            parent.children[index] = footnote2html(reference);
            usedFootnotes.add(definition);
          }
        }
      );
      if (usedFootnotes.size > 0) {
        addBreak();
        root.children.push(heading(2, text("Footnotes")) as Content);
        const footnoteItems: Node[] = [];
        for (const definition of usedFootnotes) {
          footnoteItems.push(listItem(footnoteDef2html(definition)));
        }
        root.children.push(list("ordered", footnoteItems) as Content);
      }
    }

    if (!fname || insideNoteRef) {
      // Even inside a note ref, render footnotes because we want them in there too
      addFootnotes();
      return;
    }

    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtils.getNoteByFnameFromEngine({
      fname,
      engine,
      vault: vault!,
    });

    // check if v5 is active
    if (MDUtilsV5.isV5Active(proc)) {
      const resp = MDUtilsV5.getProcData(proc);
      hierarchyDisplay = ConfigUtils.getEnableChildLinks(resp.config, { note });
    }

    /** Add frontmatter tags, if any, ahead of time. This way wikilink compiler will pick them up and render them. */
    function addTags() {
      const enableFrontmatterTags =
        ConfigUtils.getEnableFrontmatterTags(config);
      if (
        enableFrontmatterTags !== false &&
        note?.tags &&
        note.tags.length > 0
      ) {
        addBreak();
        root.children.push(heading(2, text("Tags")) as Content);
        const tags = _.isString(note.tags) ? [note.tags] : note.tags;
        const tagLinks = _.sortBy(
          _.map(tags, (tag) =>
            listItem(
              paragraph(
                frontmatterTag2WikiLinkNoteV4(
                  tag,
                  ConfigUtils.getEnableHashesForFMTags(config)
                )
              )
            )
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
          u("strong", [{ type: "text", value: hierarchyDisplayTitle }])
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
    if (hierarchyDisplay) {
      addChildren();
    }
    addTags();
    addFootnotes();

    // end transformer
  }
  return transformer;
};

export { plugin as hierarchies };
export { PluginOpts as HierarchiesOpts };
