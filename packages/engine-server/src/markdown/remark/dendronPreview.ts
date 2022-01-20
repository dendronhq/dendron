import {
  APIUtils,
  AssetGetRequest,
  ConfigUtils,
  isWebUri,
} from "@dendronhq/common-all";
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
import fs from "fs-extra";
import mimeTypes from "mime-types";

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
  const ctx = "handleImage";
  const { logger, dispose } = createDisposableLogger("handleImage");
  // ignore web images
  if (isWebUri(node.url)) {
    logger.debug({ ctx, url: node.url });
    return;
  }
  // assume that the path is relative to vault
  const { wsRoot, vault } = MDUtilsV5.getProcData(proc);
  const fpath = path.join(vault2Path({ vault, wsRoot }), node.url);
  if (useFullPathUrl === true) {
    logger.info({ ctx, wsRoot, vault, url: node.url, fpath, useFullPathUrl });
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
  logger.info({
    ctx,
    url: node.url,
    useFullPathUrl,
    opts: MDUtilsV5.getProcOpts(proc),
  });
  dispose();
}

/** URL encode the image to avoid having to proxy it.
 *
 * This might slow down the preview because the engine has to encode all the
 * images for every preview update. It also means more data has to be
 * transferred to the preview with each update (with normal operation preview
 * would have cached the images).
 */
function encodeImage(opts: { proc: Unified.Processor; node: Image }) {
  const { proc, node } = opts;
  if (isWebUri(node.url)) return;
  // We need the full path to read the image file
  handleImage({ ...opts, useFullPathUrl: true });
  try {
    const imageFile = fs.readFileSync(node.url);
    const mime = mimeTypes.lookup(node.url);
    node.url = `data:${mime};base64,${imageFile.toString("base64")}`;
  } catch (err) {
    // If anything happens, defer to original handleImage
    return handleImage({ proc, node });
  }
}

function plugin(this: Unified.Processor, _opts?: PluginOpts): Transformer {
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, _index, _parent) => {
      if (RemarkUtils.isImage(node) || RemarkUtils.isExtendedImage(node)) {
        // Possible workaround for when preview can't access images directly
        const { config } = MDUtilsV5.getProcData(proc);
        if (ConfigUtils.getDev(config)?.enablePreviewDirectImage) {
          return encodeImage({ proc, node });
        }
        // Normally, the engine proxies images for the preview
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
    visit(tree, (node, _index, _parent) => {
      if (RemarkUtils.isImage(node) || RemarkUtils.isExtendedImage(node)) {
        // Hover preview can't use API URL's because they are http not https, so we instead have to get the image from disk.
        return handleImage({ proc, node, useFullPathUrl: true });
      }
    });
  }
  return transformer;
}

export { plugin as dendronPreview };
export { PluginOpts as DendronPreviewOpts };
