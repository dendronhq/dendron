import {
  ConfigUtils,
  DendronError,
  DVault,
  ERROR_SEVERITY,
  IntermediateDendronConfig,
  isNotUndefined,
  isWebUri,
  NoteDictsUtils,
  NoteProps,
  NoteUtils,
  ProcFlavor,
  StatusCodes,
  TAGS_HIERARCHY,
  TaskNoteUtils,
  VaultUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import type { Image, Link, Root } from "mdast";
import { paragraph, text } from "mdast-builder";
import Unified, { Processor, Transformer } from "unified";
import { Node, Parent } from "unist";
import u from "unist-builder";
import visitParents from "unist-util-visit-parents";
import { VFile } from "vfile";
import { SiteUtils } from "../SiteUtils";
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
import {
  MDUtilsV5,
  ProcDataFullOptsV5,
  ProcMode,
  ProcOptsV5,
} from "../utilsv5";
import { blockAnchor2html } from "./blockAnchors";
import { extendedImage2html } from "./extendedImage";
import { convertNoteRefToHAST, NoteRefsOptsV2 } from "./noteRefsV2";
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
 * Get the vault name, either from processor or passed in vaultName
 * @param opts.vaultMissingBehavior how to respond if no vault is found. See {@link VaultMissingBehavior}
 */
function getVault({
  vaultMissingBehavior,
  vaultName,
  vault,
  vaults,
}: {
  vaultName?: string;
  vaultMissingBehavior: VaultMissingBehavior;
  vault: DVault;
  vaults: DVault[];
}) {
  if (vaultName) {
    try {
      vault = VaultUtils.getVaultByNameOrThrow({
        vaults,
        vname: vaultName,
      });
    } catch (err) {
      if (vaultMissingBehavior === VaultMissingBehavior.THROW_ERROR) {
        throw err;
      }
    }
  }
  return vault;
}

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

/**
 * Handles AST nodes that contain urls (i.e images, extended images, and links)
 *
 * Provides a matcher that could be used in the transformer so that a node could be
 * matched for potential transformation.
 *
 * Handler takes the node and correct / resolves the url properly.
 */
class NodeUrlHandler {
  // Detects if its a link to a header on the same page (this is valid in Github
  // flavored markdown). If we need this elsewhere, we can pull this function
  // out into a util.
  private static isSamePageHeaderUrl(url: string): boolean {
    return url.startsWith("#");
  }

  static match(node: Node | any, { pData }: DendronUnifiedHandlerMatchOpts) {
    return (
      (node.type === DendronASTTypes.IMAGE ||
        node.type === DendronASTTypes.EXTENDED_IMAGE ||
        node.type === DendronASTTypes.LINK) &&
      pData.dest === DendronASTDest.HTML
    );
  }

  static handle(
    node: Image | Link,
    { proc, cOpts }: DendronUnifiedHandlerHandleOpts<PluginOpts>
  ): { node: Image | Link; nextAction?: DendronUnifiedHandlerNextAction } {
    if (!isWebUri(node.url) && !NodeUrlHandler.isSamePageHeaderUrl(node.url)) {
      const { config } = MDUtilsV5.getProcData(proc);
      //handle assetPrefix
      const publishingConfig = ConfigUtils.getPublishingConfig(config);
      const assetsPrefix = MDUtilsV5.isV5Active(proc)
        ? publishingConfig.assetsPrefix
        : cOpts?.assetsPrefix;

      const url = _.trim(node.url, "/");
      node.url = (assetsPrefix ? assetsPrefix + "/" : "/") + url;
    }
    return { node };
  }
}

function shouldInsertTitle({ proc }: { proc: Processor }) {
  const data = MDUtilsV5.getProcData(proc);
  const opts = MDUtilsV5.getProcOpts(proc);
  const isNoteRef = !_.isNumber(data.noteRefLvl) && data.noteRefLvl > 0;
  let insertTitle;
  if (isNoteRef || opts.flavor === ProcFlavor.BACKLINKS_PANEL_HOVER) {
    insertTitle = false;
  } else {
    const config = data.config as IntermediateDendronConfig;
    const shouldApplyPublishRules = MDUtilsV5.shouldApplyPublishingRules(proc);
    insertTitle = ConfigUtils.getEnableFMTitle(config, shouldApplyPublishRules);
  }
  return insertTitle;
}

function plugin(this: Unified.Processor, opts?: PluginOpts): Transformer {
  const proc = this;
  const { vault, vaults, wsRoot } = MDUtilsV5.getProcData(proc);
  const pOpts = MDUtilsV5.getProcOpts(proc);
  const { mode } = pOpts;
  const pData = MDUtilsV5.getProcData(proc);
  const {
    dest,
    fname,
    config,
    insideNoteRef,
    noteToRender,
    noteCacheForRenderDict,
  } = pData;

  function transformer(tree: Node, _file: VFile) {
    const root = tree as Root;
    const insertTitle = shouldInsertTitle({ proc });
    if (mode !== ProcMode.IMPORT && !insideNoteRef && root.children) {
      if (!fname || !vault) {
        // TODO: tmp
        throw new DendronError({
          message: `dendronPub - no fname or vault for node: ${JSON.stringify(
            tree
          )}`,
        });
      }
      let note;
      // Special Logic for 403 Error Static Page:
      if (fname === "403") {
        note = SiteUtils.create403StaticNote({ vaults });
      } else {
        note = noteToRender;
      }
      // ^53ueid06urse
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
      if (node.type === DendronASTTypes.WIKI_LINK) {
        const shouldApplyPublishingRules =
          MDUtilsV5.shouldApplyPublishingRules(proc);
        const enableNoteTitleForLink = ConfigUtils.getEnableNoteTitleForLink(
          config,
          shouldApplyPublishingRules
        );

        // If the target is Dendron, no processing of links is needed
        if (dest === DendronASTDest.MD_DENDRON) return;
        const _node = node as WikiLinkNoteV4;
        // @ts-ignore
        let value = node.value as string;
        // we change this later
        const valueOrig = value;
        let isPublished = true;
        const data = _node.data;
        // eslint-disable-next-line prefer-const
        let { vault } = MDUtilsV5.getProcData(proc);
        vault = getVault({
          vault,
          vaults,
          vaultMissingBehavior: VaultMissingBehavior.FALLBACK_TO_ORIGINAL_VAULT,
          vaultName: data.vaultName,
        });

        let error: DendronError | undefined;
        let note: NoteProps | undefined;
        if (mode !== ProcMode.IMPORT) {
          if (noteCacheForRenderDict) {
            note = NoteDictsUtils.findByFname(
              valueOrig,
              noteCacheForRenderDict,
              vault
            )[0];
          }

          if (!note) {
            error = new DendronError({ message: `no note found. ${value}` });
          }
        }

        let color: string | undefined;
        if (mode !== ProcMode.IMPORT && value.startsWith(TAGS_HIERARCHY)) {
          const { color: maybeColor, type: colorType } = NoteUtils.color({
            fname: value,
            vault,
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
              wsRoot,
              vaults,
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

        let title;
        if (enableNoteTitleForLink) {
          if (noteCacheForRenderDict) {
            const targetVault = data.vaultName
              ? VaultUtils.getVaultByName({ vname: data.vaultName, vaults })
              : undefined;

            const target = NoteDictsUtils.findByFname(
              valueOrig,
              noteCacheForRenderDict,
              targetVault
            )[0];

            if (target) {
              title = target.title;
            }
          }
        }

        const alias = data.alias ?? title ?? value;
        const href = SiteUtils.getSiteUrlPathForNote({
          addPrefix: pOpts.flavor === ProcFlavor.PUBLISHING,
          pathValue: value,
          config,
          pathAnchor: data.anchorHeader,
          note,
        });
        const exists = true;
        // for rehype
        //_node.value = newValue;
        //_node.value = alias;

        const { before, after } = linkExtras({ note, config });

        _node.data = {
          vaultName: data.vaultName,
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
            ...before,
            {
              type: "text",
              value: alias,
            },
            ...after,
          ],
        } as RehypeLinkData;

        if (value === "403") {
          const aliasToUse = alias === "403" ? valueOrig : alias;
          _node.data = {
            alias: aliasToUse,
            hName: "a",
            hProperties: {
              title: "Private",
              href: "https://wiki.dendron.so/notes/hfyvYGJZQiUwQaaxQO27q.html",
              target: "_blank",
              class: "private",
            },
            hChildren: [
              {
                type: "text",
                value: `${aliasToUse} (Private)`,
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
        const procOpts = MDUtilsV5.getProcOpts(proc);
        const { data: noteRefHAST } = convertNoteRefToHAST({
          link: ndata.link,
          proc,
          compilerOpts: copts,
          procOpts,
        });

        if (noteRefHAST) {
          parent.children = replacedUnrenderedRefWithConvertedData(
            noteRefHAST,
            parent.children
          );
        }
      }
      if (node.type === DendronASTTypes.BLOCK_ANCHOR) {
        // no transform
        if (dest !== DendronASTDest.HTML) {
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
        if (RemarkUtils.isTable(target)) {
          // Can't install as a child of the table directly, has to go into a table cell
          target = target.children[0].children[0];
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
      if (NodeUrlHandler.match(node, { pData, pOpts })) {
        const { nextAction } = NodeUrlHandler.handle(node as Image, {
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

/** Generate elements to be included before and after the text of a wikilink. */
function linkExtras({
  note,
  config,
}: {
  note?: NoteProps;
  config: IntermediateDendronConfig;
}): {
  before: any[];
  after: any[];
} {
  const before = [];
  const after = [];

  // For task notes, add the status, priority, due, and owner info
  if (
    note &&
    TaskNoteUtils.isTaskNote(note) &&
    ConfigUtils.getPublishing(config).enableTaskNotes
  ) {
    const taskConfig = ConfigUtils.getTask(config);
    const status = TaskNoteUtils.getStatusSymbolRaw({
      note,
      taskConfig,
    });
    if (status) {
      const checkbox: { [key: string]: any } = {
        type: "element",
        tagName: "input",
        properties: {
          type: "checkbox",
          disabled: true,
          className: "task-before task-status",
        },
      };
      if (TaskNoteUtils.isTaskComplete({ note, taskConfig })) {
        checkbox.properties.checked = true;
      } else if (status.trim().length > 0) {
        checkbox.children = [span("task-status-text", `(${status})`)];
      }

      before.push(checkbox);
    }
    const priority = TaskNoteUtils.getPrioritySymbol({
      note,
      taskConfig,
    });
    if (priority) {
      after.push(span("task-after task-priority", `priority:${priority}`));
    }
    const { due, owner } = note.custom;
    if (due) {
      after.push(span("task-after task-due", `due:${due}`));
    }
    if (owner) {
      after.push(span("task-after task-owner", `@${owner}`));
    }
  }
  return { before, after };
}

/** Generates a hast (unifiedjs html) element for a span that has the given class names, and contains the given text as contents. */
function span(className: string, text: string) {
  return {
    type: "element",
    tagName: "span",
    properties: {
      className,
    },
    children: [{ type: "text", value: text }],
  };
}

export { plugin as dendronPub };
export { PluginOpts as DendronPubOpts };
