import { APIUtils, AssetGetRequest } from "@dendronhq/common-all";
import { createDisposableLogger, vault2Path } from "@dendronhq/common-server";
import _ from "lodash";
import { Image } from "mdast";
import path from "path";
import Unified, { Transformer } from "unified";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { RemarkUtils } from ".";
import { EngineUtils } from "../../utils";
import { MDUtilsV5 } from "../utilsv5";

type PluginOpts = {};

/**
 *
 * @param useFullPathUrl `false` by default, and the generated URL for images will go through engine API.
 *   When `true`, the image URL will be a full path to the image on disk instead.
 * @returns
 */
function handleImage({
  proc,
  node,
  useFullPathUrl = false,
}: {
  proc: Unified.Processor;
  node: Image;
  useFullPathUrl?: boolean;
}) {
  const { logger, dispose } = createDisposableLogger("handleImage");
  try {
    const ctx = "handleImage";
    // ignore web images
    if (_.some(["http://", "https://"], (ent) => node.url.startsWith(ent))) {
      logger.debug({ ctx, url: node.url });
      return;
    }
    // assume that the path is relative to vault
    const { wsRoot, vault } = MDUtilsV5.getProcData(proc);
    const fpath = path.join(vault2Path({ vault, wsRoot }), node.url);
    if (useFullPathUrl === true) {
      logger.debug({
        ctx,
        wsRoot,
        vault,
        url: node.url,
        fpath,
        useFullPathUrl,
      });
      node.url = fpath;
      return;
    }
    const resp = EngineUtils.getEnginePort({ wsRoot });
    if (resp.error) {
      logger.error(resp.error);
      return;
    }
    const port: number = resp.data;
    const url = EngineUtils.getLocalEngineUrl({ port }) + "/api/assets";
    const params: AssetGetRequest = {
      fpath,
      ws: wsRoot,
    };
    node.url = APIUtils.genUrlWithQS({ url, params });
    logger.debug({
      ctx,
      url: node.url,
      useFullPathUrl,
      opts: MDUtilsV5.getProcOpts(proc),
    });
  } finally {
    dispose();
  }
}

function plugin(this: Unified.Processor, _opts?: PluginOpts): Transformer {
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, _index, _parent) => {
      if (RemarkUtils.isImage(node) || RemarkUtils.isExtendedImage(node)) {
        return handleImage({ proc, node });
      }
    });
  }
  return transformer;
}

export function dendronHoverPreview(
  this: Unified.Processor,
  _opts?: PluginOpts
): Transformer {
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, index, parent) => {
      if (RemarkUtils.isImage(node) || RemarkUtils.isExtendedImage(node)) {
        // Hover preview can't use API URL's because they are http not https, so we instead have to get the image from disk.
        return handleImage({ proc, node, useFullPathUrl: true });
      }
      // Remove the frontmatter because it will break the output
      if (RemarkUtils.isFrontmatter(node) && parent) {
        // Remove this node
        parent.children.splice(index, 1);
        // Since we removed this node, the next node to process will be the same index
        return index;
      }
    });
  }
  return transformer;
}

export { plugin as dendronPreview };
export { PluginOpts as DendronPreviewOpts };
