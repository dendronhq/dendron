import { vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import { Image } from "mdast";
import path from "path";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { AnchorUtils, RemarkUtils } from ".";
import { DendronASTTypes, WikiLinkNoteV4 } from "../types";
import { MDUtilsV5 } from "../utilsv5";

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
  const fpath = path.join(vault2Path({ wsRoot, vault }), node.url);
  node.url = fpath;
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

  const goToNoteCommandOpts = {
    qs: node.value,
    vault,
    anchor,
  };

  const encodedArgs = encodeURIComponent(JSON.stringify(goToNoteCommandOpts));
  node.value = `command:dendron.gotoNote?${encodedArgs}`;
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
        }
        return undefined; // continue
      }
    );
  }
  return transformer;
}

export { PluginOpts as DendronPreviewOpts };
