import { vault2Path } from "@dendronhq/common-all";
import _ from "lodash";
import { Image, Link, Text } from "mdast";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { AnchorUtils, RemarkUtils } from ".";
import { DendronASTTypes, HashTag, UserTag, WikiLinkNoteV4 } from "../types";
import { MDUtilsV5 } from "../utilsv5";
import { URI, Utils } from "vscode-uri";

type PluginOpts = {};

/** Makes the `.url` of the given image note a full path. */
export function makeImageUrlFullPath({
  proc,
  node,
}: {
  proc: Unified.Processor;
  node: Image;
}) {
  // ignore web images
  if (_.some(["http://", "https://"], (ent) => node.url.startsWith(ent))) {
    return;
  }
  // assume that the path is relative to vault
  const { wsRoot, vault } = MDUtilsV5.getProcData(proc);
  const uri = Utils.joinPath(
    vault2Path({ wsRoot: URI.file(wsRoot), vault }),
    decodeURI(node.url)
  );
  node.url = uri.fsPath;
}

/**
 * Transforms any wiklinks into a vscode command URI for gotoNote.
 */
function modifyWikilinkValueToCommandUri({
  proc,
  node,
}: {
  proc: Unified.Processor;
  node: WikiLinkNoteV4;
}) {
  const { vault } = MDUtilsV5.getProcData(proc);

  const anchor = node.data.anchorHeader
    ? AnchorUtils.string2anchor(node.data.anchorHeader)
    : undefined;

  const qs = node.value;
  const goToNoteCommandOpts = {
    qs,
    vault,
    anchor,
  };
  const encodedArgs = encodeURIComponent(JSON.stringify(goToNoteCommandOpts));
  node.data.alias = node.data.alias || qs;
  node.value = `command:dendron.gotoNote?${encodedArgs}`;
}

/**
 * Transforms any UserTag or HashTag nodes into a vscode command URI for gotoNote.
 */
function modifyTagValueToCommandUri({
  proc,
  node,
}: {
  proc: Unified.Processor;
  node: UserTag | HashTag;
}) {
  const { vault } = MDUtilsV5.getProcData(proc);

  const goToNoteCommandOpts = {
    qs: node.fname,
    vault,
  };

  const encodedArgs = encodeURIComponent(JSON.stringify(goToNoteCommandOpts));

  // Convert the node to a 'link' type so that it can behave properly like a
  // link instead of the tag behavior, since we've changed the value to a
  // command URI
  (node as unknown as Link).type = "link";
  (node as unknown as Link).url = `command:dendron.gotoNote?${encodedArgs}`;

  const childTextNode: Text = {
    type: "text",
    value: node.value,
  };

  (node as unknown as Link).children = [childTextNode];
}

export function dendronHoverPreview(
  this: Unified.Processor,
  _opts?: PluginOpts
): Transformer {
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    visit(
      tree,
      [
        DendronASTTypes.FRONTMATTER,
        DendronASTTypes.IMAGE,
        DendronASTTypes.EXTENDED_IMAGE,
        DendronASTTypes.WIKI_LINK,
        DendronASTTypes.USERTAG,
        DendronASTTypes.HASHTAG,
      ],
      (node, index, parent) => {
        // Remove the frontmatter because it will break the output
        if (RemarkUtils.isFrontmatter(node) && parent) {
          // Remove this node
          parent.children.splice(index, 1);
          // Since this removes the frontmatter node, the next node to visit is at the same index.
          return index;
        }
        if (RemarkUtils.isImage(node) || RemarkUtils.isExtendedImage(node)) {
          makeImageUrlFullPath({ proc, node });
        } else if (RemarkUtils.isWikiLink(node)) {
          modifyWikilinkValueToCommandUri({ proc, node });
        } else if (RemarkUtils.isUserTag(node) || RemarkUtils.isHashTag(node)) {
          modifyTagValueToCommandUri({ proc, node });
        }
        return undefined; // continue
      }
    );
  }
  return transformer;
}

export { PluginOpts as DendronPreviewOpts };
