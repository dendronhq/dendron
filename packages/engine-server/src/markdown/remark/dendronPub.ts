import {
  ConfigUtils,
  DendronError,
  ERROR_SEVERITY,
  isNotUndefined,
  isWebUri,
  NoteProps,
  NoteUtils,
  StatusCodes,
  TAGS_HIERARCHY,
} from "@dendronhq/common-all";
import _ from "lodash";
import type { Image, Root } from "mdast";
import { paragraph, text } from "mdast-builder";
import Unified, { Processor, Transformer } from "unified";
import { Node, Parent } from "unist";
import u from "unist-builder";
import visitParents from "unist-util-visit-parents";
import { VFile } from "vfile";
import { SiteUtils } from "../../topics/site";
import {
  BlockAnchor,
  DendronASTDest,
  DendronASTTypes,
  ExtendedImage,
  HashTag,
  NoteRefDataV4,
  RehypeLinkData,
  UserTag,
  VaultMissingBehavior,
  WikiLinkNoteV4,
} from "../types";
import { MDUtilsV4 } from "../utils";
import {
  MDUtilsV5,
  ProcDataFullOptsV5,
  ProcMode,
  ProcOptsV5,
} from "../utilsv5";
import { blockAnchor2html } from "./blockAnchors";
import { extendedImage2html } from "./extendedImage";
import { convertNoteRefASTV2, NoteRefsOptsV2 } from "./noteRefsV2";
import {
  addError,
  hashTag2WikiLinkNoteV4,
  RemarkUtils,
  userTag2WikiLinkNoteV4,
} from "./utils";

type PluginOpts = NoteRefsOptsV2 & {
  assetsPrefix?: string;
  insertTitle?: boolean;
  /**
   * Don't publish pages that are dis-allowd by dendron.yml
   */
  transformNoPublish?: boolean;
  /** Don't display randomly generated colors for tags, only display color if it's explicitly set by the user. */
  noRandomlyColoredTags?: boolean;
};

/**
 * Returns a new copy of children array where the first un-rendered
 * reference ![[ref]] in children array is replaced with the given `data`. */
function replacedUnrenderedRefWithConvertedData(
  data: Parent[],
  children: Node[]
) {
  if (children.length > 1) {
    const idx = _.findIndex(children, RemarkUtils.isNoteRefV2);
    const processedChildren = children
      .slice(0, idx)
      .concat(data)
      .concat(children.slice(idx + 1));
    return processedChildren;
  } else {
    return data;
  }
}

type DendronUnifiedHandlerMatchOpts = {
  pOpts: ProcOptsV5;
  pData: ProcDataFullOptsV5;
};

type DendronUnifiedHandlerHandleOpts<T = any> = {
  proc: Processor;
  parent: Node;
  cOpts?: T;
};

type DendronUnifiedHandlerNextAction = undefined | number;

abstract class DendronNodeHander {
  static match: (
    node: Node | any,
    { pData }: DendronUnifiedHandlerMatchOpts
  ) => boolean;
}

class ImageNodeHandler extends DendronNodeHander {
  static match(node: Node | any, { pData }: DendronUnifiedHandlerMatchOpts) {
    return (
      (node.type === DendronASTTypes.IMAGE ||
        node.type === DendronASTTypes.EXTENDED_IMAGE) &&
      pData.dest === DendronASTDest.HTML
    );
  }

  static handle(
    node: Image,
    { proc, cOpts }: DendronUnifiedHandlerHandleOpts<PluginOpts>
  ): { node: Image; nextAction?: DendronUnifiedHandlerNextAction } {
    const { config } = MDUtilsV5.getProcData(proc);
    //handle assetPrefix
    const publishingConfig = ConfigUtils.getPublishingConfig(config);
    const assetsPrefix = MDUtilsV5.isV5Active(proc)
      ? publishingConfig.assetsPrefix
      : cOpts?.assetsPrefix;
    const imageNode = node;
    if (assetsPrefix) {
      const imageUrl = _.trim(imageNode.url, "/");
      // do not add assetPrefix for http/https url
      imageNode.url = !isWebUri(imageUrl)
        ? "/" + _.trim(assetsPrefix, "/") + "/" + imageUrl
        : imageUrl;
    }
    return { node: imageNode };
  }
}

function plugin(this: Unified.Processor, opts?: PluginOpts): Transformer {
  const proc = this;
  let { overrides, vault } = MDUtilsV4.getDendronData(proc);
  const pOpts = MDUtilsV5.getProcOpts(proc);
  const { mode } = pOpts;
  const pData = MDUtilsV5.getProcData(proc);
  const { dest, fname, config, insideNoteRef } = pData;

  function transformer(tree: Node, _file: VFile) {
    const root = tree as Root;
    const { error: engineError, engine } = MDUtilsV4.getEngineFromProc(proc);
    const insertTitle = !_.isUndefined(overrides?.insertTitle)
      ? overrides?.insertTitle
      : opts?.insertTitle;
    if (mode !== ProcMode.IMPORT && !insideNoteRef && root.children) {
      if (!fname || !vault) {
        // TODO: tmp
        throw new DendronError({
          message: `dendronPub - no fname or vault for node: ${JSON.stringify(
            tree
          )}`,
        });
      }
      const note = NoteUtils.getNoteByFnameFromEngine({
        fname,
        vault,
        engine,
      });
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
    }
    visitParents(tree, (node, ancestors) => {
      const parent = _.last(ancestors);
      if (_.isUndefined(parent) || !RemarkUtils.isParent(parent)) return; // root node
      if (node.type === DendronASTTypes.HASHTAG) {
        const hashtag = node as HashTag;
        const parentIndex = _.findIndex(parent.children, node);
        if (parentIndex === -1) return;
        // For hashtags, convert them to regular links for rendering
        // but not if they are inside of a link, otherwise they break link rendering.
        if (!ancestors.some((node) => RemarkUtils.isLink(node))) {
          node = hashTag2WikiLinkNoteV4(hashtag);
        } else {
          // If they are inside a link, rendering them as wikilinks will break the link rendering. Convert them to regular text.
          node = text(hashtag.value);
        }
        parent.children[parentIndex] = node;
      }
      if (node.type === DendronASTTypes.USERTAG) {
        const userTag = node as UserTag;
        const parentIndex = _.findIndex(parent.children, node);
        if (parentIndex === -1) return;
        // Convert user tags to regular links for rendering
        // but not if they are inside of a link, otherwise they break link rendering.
        if (!ancestors.some((node) => RemarkUtils.isLink(node))) {
          node = userTag2WikiLinkNoteV4(userTag);
        } else {
          node = text(userTag.value);
        }
        parent.children[parentIndex] = node;
      }
      if (
        node.type === DendronASTTypes.WIKI_LINK &&
        dest !== DendronASTDest.MD_ENHANCED_PREVIEW
      ) {
        // If the target is Dendron, no processing of links is needed
        if (dest === DendronASTDest.MD_DENDRON) return;
        const _node = node as WikiLinkNoteV4;
        // @ts-ignore
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
          note = NoteUtils.getNoteByFnameFromEngine({
            fname: valueOrig,
            vault,
            engine,
          });

          if (!note) {
            error = new DendronError({ message: `no note found. ${value}` });
          }
        }

        let color: string | undefined;
        if (mode !== ProcMode.IMPORT && value.startsWith(TAGS_HIERARCHY)) {
          const { color: maybeColor, type: colorType } = NoteUtils.color({
            fname: value,
            vault,
            engine,
          });
          const enableRandomlyColoredTagsConfig =
            ConfigUtils.getEnableRandomlyColoredTags(config);
          if (
            colorType === "configured" ||
            (enableRandomlyColoredTagsConfig && !opts?.noRandomlyColoredTags)
          ) {
            color = maybeColor;
          }
        }

        const copts = opts?.wikiLinkOpts;
        if (!note && opts?.transformNoPublish) {
          const code = StatusCodes.FORBIDDEN;
          value = _.toString(code);
          addError(
            proc,
            new DendronError({
              message: "no note",
              code,
              severity: ERROR_SEVERITY.MINOR,
            })
          );
        } else if (note && opts?.transformNoPublish) {
          if (error) {
            value = _.toString(StatusCodes.FORBIDDEN);
            addError(proc, error);
          } else if (!config) {
            const code = StatusCodes.FORBIDDEN;
            value = _.toString(code);
            addError(
              proc,
              new DendronError({
                message: "no config",
                code,
                severity: ERROR_SEVERITY.MINOR,
              })
            );
          } else {
            isPublished = SiteUtils.isPublished({
              note,
              config,
              engine,
            });
            if (!isPublished) {
              value = _.toString(StatusCodes.FORBIDDEN);
            }
          }
        }

        let useId = copts?.useId;
        if (
          useId === undefined &&
          MDUtilsV5.isV5Active(proc) &&
          dest === DendronASTDest.HTML
        ) {
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
        const usePrettyLinks = ConfigUtils.getEnablePrettlyLinks(config);
        const maybeFileExtension =
          _.isBoolean(usePrettyLinks) && usePrettyLinks ? "" : ".html";
        // in v4, copts.prefix = absUrl + "/" + siteNotesDir + "/";
        // if v5, copts.prefix = ""
        let href: string;
        if (MDUtilsV5.isV5Active(proc)) {
          href = `${copts?.prefix || ""}${value}${maybeFileExtension}${
            data.anchorHeader ? "#" + data.anchorHeader : ""
          }`;
        } else {
          href = `${copts?.prefix || ""}${value}${maybeFileExtension}${
            data.anchorHeader ? "#" + data.anchorHeader : ""
          }`;
        }
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
              title: "Private",
              style: "color: brown",
              href: "https://wiki.dendron.so/notes/hfyvYGJZQiUwQaaxQO27q.html",
              target: "_blank",
            },
            hChildren: [
              {
                type: "text",
                value: `${alias} (Private)`,
              },
            ],
          } as RehypeLinkData;
        }
      }
      if (node.type === DendronASTTypes.REF_LINK_V2) {
        // If the target is Dendron, no processing of refs is needed
        if (dest === DendronASTDest.MD_DENDRON) return;
        // we have custom compiler for markdown to handle note ref
        const ndata = node.data as NoteRefDataV4;
        const copts: NoteRefsOptsV2 = {
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
          parent.children = replacedUnrenderedRefWithConvertedData(
            data,
            parent.children
          );
        }
      }
      if (node.type === DendronASTTypes.BLOCK_ANCHOR) {
        // no transform
        if (
          dest === DendronASTDest.MD_ENHANCED_PREVIEW ||
          dest === DendronASTDest.MD_REGULAR
        ) {
          return;
        }
        const anchorHTML = blockAnchor2html(node as BlockAnchor);
        let target: Node | undefined;
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
          if (_.isUndefined(previous)) {
            // Block anchor at the very start of the note, just add anchor to the start
            target = grandParent;
          } else {
            // There's an actual block before the anchor
            target = previous;
          }
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

        if (RemarkUtils.isParent(target)) {
          // Install the block anchor at the target node
          target.children.unshift(anchorHTML);
        } else if (RemarkUtils.isRoot(target)) {
          // If the anchor is the first thing in the note, anchorHTML goes to the start of the document
          target.children.unshift(anchorHTML);
        } else if (RemarkUtils.isParent(grandParent)) {
          // For some elements (for example code blocks) we can't install the block anchor on them.
          // In that case we at least put a link before the element so that the link will at least work.
          const targetIndex = _.indexOf(grandParent.children, target);
          const targetWrapper = paragraph([
            anchorHTML,
            grandParent.children[targetIndex],
          ]);
          grandParent.children.splice(targetIndex, 1, targetWrapper);
        }
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
      // The url correction needs to happen for both regular and extended images
      if (ImageNodeHandler.match(node, { pData, pOpts })) {
        const { nextAction } = ImageNodeHandler.handle(node as Image, {
          proc,
          parent,
          cOpts: opts,
        });
        if (nextAction) {
          return nextAction;
        }
      }
      if (
        node.type === DendronASTTypes.EXTENDED_IMAGE &&
        dest === DendronASTDest.HTML
      ) {
        const index = _.indexOf(parent.children, node);
        // Replace with the HTML containing the image including custom properties
        parent.children.splice(
          index,
          1,
          extendedImage2html(node as ExtendedImage)
        );
      }
      return; // continue traversal
    });
    return tree;
  }
  return transformer;
}

export { plugin as dendronPub };
export { PluginOpts as DendronPubOpts };
