import {
  DendronError,
  isNotUndefined,
  NoteProps,
  NoteUtils,
  TAGS_HIERARCHY,
} from "@dendronhq/common-all";
import _ from "lodash";
import { Content, Image, Root } from "mdast";
import { heading, paragraph, text } from "mdast-builder";
import {
  frontmatterTag2WikiLinkNoteV4,
  addError,
  getNoteOrError,
  hashTag2WikiLinkNoteV4,
  RemarkUtils,
  userTag2WikiLinkNoteV4,
} from "./utils";
import Unified, { Transformer } from "unified";
import { Node, Parent } from "unist";
import u from "unist-builder";
import visitParents from "unist-util-visit-parents";
import { VFile } from "vfile";
import { SiteUtils } from "../../topics/site";
import {
  BlockAnchor,
  DendronASTDest,
  DendronASTTypes,
  HashTag,
  NoteRefDataV4,
  RehypeLinkData,
  UserTag,
  VaultMissingBehavior,
  WikiLinkNoteV4,
} from "../types";
import { MDUtilsV4 } from "../utils";
import { MDUtilsV5, ProcMode } from "../utilsv5";
import { blockAnchor2html } from "./blockAnchors";
import { NoteRefsOpts } from "./noteRefs";
import { convertNoteRefASTV2 } from "./noteRefsV2";

type PluginOpts = NoteRefsOpts & {
  assetsPrefix?: string;
  insertTitle?: boolean;
  /**
   * Don't publish pages that are dis-allowd by dendron.yml
   */
  transformNoPublish?: boolean;
  /** Don't display randomly generated colors for tags, only display color if it's explicitly set by the user. */
  noRandomlyColoredTags?: boolean;
};

function plugin(this: Unified.Processor, opts?: PluginOpts): Transformer {
  const proc = this;
  const procData = MDUtilsV4.getDendronData(proc);
  const { mode } = MDUtilsV5.getProcOpts(proc);
  const { dest, fname, config, overrides, insideNoteRef } = procData;
  let vault = procData.vault;

  function transformer(tree: Node, _file: VFile) {
    const root = tree as Root;
    const { error: engineError, engine } = MDUtilsV4.getEngineFromProc(proc);
    const insertTitle = !_.isUndefined(overrides?.insertTitle)
      ? overrides?.insertTitle
      : opts?.insertTitle;
    if (mode !== ProcMode.IMPORT && !insideNoteRef && root.children) {
      if (!fname || !vault) {
        // TODO: tmp
        console.log(JSON.stringify(engine.notes));
        throw new DendronError({
          message: `dendronPub - no fname or vault for node: ${JSON.stringify(
            tree
          )}`,
        });
      }
      const note = MDUtilsV5.getNoteByFname(proc, { fname });
      if (!note) {
        throw new DendronError({ message: `no note found for ${fname}` });
      }
      if (insertTitle) {
        const idx = _.findIndex(root.children, (ent) => ent.type !== "yaml");
        root.children.splice(
          idx,
          0,
          u(DendronASTTypes.HEADING, { depth: 1 }, [u("text", note.title)])
        );
      }
      // Add frontmatter tags, if any, ahead of time. This way wikilink compiler will pick them up and render them.
      if (
        config?.site?.showFrontMatterTags !== false &&
        note?.tags &&
        note.tags.length > 0
      ) {
        root.children.push(heading(2, text("Tags")) as Content);
        const tagLinks = _.map(
          _.isString(note.tags) ? [note.tags] : note.tags,
          frontmatterTag2WikiLinkNoteV4
        );
        root.children.push(paragraph(tagLinks) as Content);
      }
    }
    visitParents(tree, (node, ancestors) => {
      const parent = _.last(ancestors);
      if (_.isUndefined(parent) || !RemarkUtils.isParent(parent)) return; // root node
      if (node.type === DendronASTTypes.HASHTAG) {
        const hashtag = node as HashTag;
        // For hashtags, convert them to regular links for rendering
        const parentIndex = _.findIndex(parent.children, node);
        if (parentIndex === -1) return;
        node = hashTag2WikiLinkNoteV4(hashtag);
        parent.children[parentIndex] = node;
      }
      if (node.type === DendronASTTypes.USERTAG) {
        const userTag = node as UserTag;
        // Convert user tags to regular links for rendering
        const parentIndex = _.findIndex(parent.children, node);
        if (parentIndex === -1) return;
        node = userTag2WikiLinkNoteV4(userTag);
        parent.children[parentIndex] = node;
      }
      if (
        node.type === DendronASTTypes.WIKI_LINK &&
        dest !== DendronASTDest.MD_ENHANCED_PREVIEW
      ) {
        const _node = node as WikiLinkNoteV4;
        let value = node.value as string;
        // we change this later
        const valueOrig = value;
        let isPublished = true;
        const data = _node.data;
        vault = MDUtilsV4.getVault(proc, data.vaultName, {
          vaultMissingBehavior: VaultMissingBehavior.FALLBACK_TO_ORIGINAL_VAULT,
        });
        if (engineError) {
          addError(proc, engineError);
        }

        let error: DendronError | undefined;
        let note: NoteProps | undefined;
        if (mode !== ProcMode.IMPORT) {
          const notes = NoteUtils.getNotesByFname({
            fname: valueOrig,
            notes: engine.notes,
            vault,
          });
          const out = getNoteOrError(notes, value);
          error = out.error;
          note = out.note;
        }

        let color: string | undefined;
        if (mode !== ProcMode.IMPORT && value.startsWith(TAGS_HIERARCHY)) {
          const { color: maybeColor, type: colorType } = NoteUtils.color({
            fname: value,
            vault,
            notes: engine.notes,
          });
          if (
            colorType === "configured" ||
            opts?.noRandomlyColoredTags !== false
          ) {
            color = maybeColor;
          }
        }

        const copts = opts?.wikiLinkOpts;
        if (note && opts?.transformNoPublish) {
          if (error) {
            value = "403";
            addError(proc, error);
          } else if (!note || !config) {
            value = "403";
            addError(proc, new DendronError({ message: "no note or config" }));
          } else {
            isPublished = SiteUtils.isPublished({
              note,
              config,
              engine,
            });
            if (!isPublished) {
              value = "403";
            }
          }
        }

        let useId = copts?.useId;
        if (MDUtilsV5.isV5Active(proc) && dest === DendronASTDest.HTML) {
          useId = true;
        }

        if (note && useId && isPublished) {
          if (error) {
            addError(proc, error);
          } else {
            value = note.id;
          }
        }
        const alias = data.alias ? data.alias : value;
        const usePrettyLinks = engine.config.site.usePrettyLinks;
        const maybeFileExtension =
          _.isBoolean(usePrettyLinks) && usePrettyLinks ? "" : ".html";
        const href = `${copts?.prefix || ""}${value}${maybeFileExtension}${
          data.anchorHeader ? "#" + data.anchorHeader : ""
        }`;
        const exists = true;
        // for rehype
        //_node.value = newValue;
        //_node.value = alias;
        _node.data = {
          alias,
          permalink: href,
          exists,
          hName: "a",
          hProperties: {
            className: color ? "color-tag" : undefined,
            style: color ? `--tag-color: ${color};` : undefined,
            href,
          },
          hChildren: [
            {
              type: "text",
              value: alias,
            },
          ],
        } as RehypeLinkData;

        if (value === "403") {
          _node.data = {
            alias,
            hName: "a",
            hProperties: {
              "data-toggle": "popover",
              title: "This page has not yet sprouted",
              style: "cursor: pointer",
              "data-content": [
                `<a href="https://dendron.so/">Dendron</a> (the tool used to generate this site) lets authors selective publish content. You will see this page whenever you click on a link to an unpublished page`,
                "",
                "<img src='https://foundation-prod-assetspublic53c57cce-8cpvgjldwysl.s3-us-west-2.amazonaws.com/assets/images/not-sprouted.png'></img>",
              ].join("\n"),
            },
            hChildren: [
              {
                type: "text",
                value: alias,
              },
            ],
          } as RehypeLinkData;
        }
      }
      if (node.type === DendronASTTypes.REF_LINK_V2) {
        // we have custom compiler for markdown to handle note ref
        const ndata = node.data as NoteRefDataV4;
        const copts: NoteRefsOpts = {
          wikiLinkOpts: opts?.wikiLinkOpts,
        };
        const procOpts = MDUtilsV4.getProcOpts(proc);
        const { data } = convertNoteRefASTV2({
          link: ndata.link,
          proc,
          compilerOpts: copts,
          procOpts,
        });
        if (data) {
          if (parent!.children.length > 1) {
            const children = parent!.children;
            const idx = _.findIndex(children, RemarkUtils.isNoteRefV2);
            parent!.children = children
              .slice(0, idx)
              .concat(data)
              .concat(children.slice(idx + 1, -1));
          } else {
            parent!.children = data;
          }
        }
      }
      if (node.type === DendronASTTypes.BLOCK_ANCHOR) {
        // no transform
        if (dest === DendronASTDest.MD_ENHANCED_PREVIEW) {
          return;
        }
        const procOpts = MDUtilsV4.getProcOpts(proc);
        const anchorHTML = blockAnchor2html(
          node as BlockAnchor,
          procOpts.blockAnchorsOpts
        );
        let target: Parent | undefined;
        const grandParent = ancestors[ancestors.length - 2];
        if (
          RemarkUtils.isParagraph(parent) &&
          parent.children.length === 1 &&
          isNotUndefined(grandParent) &&
          RemarkUtils.isRoot(grandParent)
        ) {
          // If the block anchor is at the top level, then it references the block before it
          const parentIndex = _.indexOf(grandParent.children, parent);
          const previous = grandParent.children[parentIndex - 1];
          if (_.isUndefined(previous) || !RemarkUtils.isParent(previous))
            return; // invalid anchor, doesn't represent anything
          target = previous;
        } else if (RemarkUtils.isTableRow(grandParent)) {
          // An anchor inside a table references the whole table.
          const greatGrandParent = ancestors[ancestors.length - 3];
          if (
            isNotUndefined(greatGrandParent) &&
            RemarkUtils.isTable(greatGrandParent)
          ) {
            // The table HTML generation drops anything not attached to a cell, so we put this in the first cell instead.
            target = greatGrandParent.children[0]?.children[0];
          }
        } else {
          // Otherwise, it references the block it's inside
          target = parent;
        }
        if (_.isUndefined(target)) return;
        if (RemarkUtils.isList(target)) {
          // Can't install as a child of the list, has to go into a list item
          target = target.children[0];
        }
        // Install the block anchor at the target node
        target.children.unshift(anchorHTML);
        // Remove the block anchor itself since we install the anchor at the target
        const index = _.indexOf(parent.children, node);
        parent!.children.splice(index, 1);

        // We might be adding and removing siblings here. We must return the index of the next sibling to traverse.
        if (target === parent) {
          // In this case, we removed block anchor but added a node to the start.
          // As a result, the indices match and traversal can continue.
          return;
        } else if (parent.children.length === 0) {
          // After removing the block anchor, there are no siblings left in the parent to traverse.
          return -1;
        } else {
          // Otherwise, the next sibling got shifted down by 1 index, it will be at the same index as the block anchor.
          return index;
        }
      }
      if (node.type === "image" && dest === DendronASTDest.HTML) {
        const imageNode = node as Image;
        if (opts?.assetsPrefix) {
          imageNode.url =
            "/" +
            _.trim(opts.assetsPrefix, "/") +
            "/" +
            _.trim(imageNode.url, "/");
        }
      }
      return; // continue traversal
    });
    return tree;
  }
  return transformer;
}

export { plugin as dendronPub };
export { PluginOpts as DendronPubOpts };
