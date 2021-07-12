import { APIUtils, AssetGetRequest } from "@dendronhq/common-all";
import { vault2Path } from "@dendronhq/common-server";
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
import { NoteRefsOpts } from "./noteRefs";

type PluginOpts = NoteRefsOpts & {};

/**
 * 
 * @param useFullPathUrl `false` by default, and the generated URL for images will go through engine API.
 *   When `true`, the image URL will be a full path to the image on disk instead.
 * @returns 
 */
function handleImage({proc, node, useFullPathUrl = false} : {proc: Unified.Processor, node: Image, useFullPathUrl?: boolean}) {
  // ignore web images
  if (_.some(["http://", "https://"], (ent) => node.url.startsWith(ent))) {
    return;
  }
  if (node.url.startsWith("/")) {
    const { wsRoot, vault } = MDUtilsV5.getProcData(proc);
    const fpath = path.join(vault2Path({ vault, wsRoot }), node.url);
    if (useFullPathUrl === true) {
      node.url = fpath;
      return;
    }
    const port = EngineUtils.getEnginePort({ wsRoot });
    const url = EngineUtils.getLocalEngineUrl({ port }) + "/api/assets";
    const params: AssetGetRequest = {
      fpath,
      ws: wsRoot,
    };
    node.url = APIUtils.genUrlWithQS({ url, params });
  }
}

function plugin(this: Unified.Processor, _opts?: PluginOpts): Transformer {
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, _index, _parent) => {
      if (RemarkUtils.isImage(node)) {
        return handleImage({proc, node});
      }
    });
  }
  return transformer;
}

export function dendronHoverPreview(this: Unified.Processor, _opts?: PluginOpts): Transformer {
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node, _index, _parent) => {
      if (RemarkUtils.isImage(node)) {
        // Hover preview can't use API URL's because they are http not https, so we instead have to get the image from disk.
        return handleImage({proc, node, useFullPathUrl: true});
      }
    });
  }
  return transformer;
}

export { plugin as dendronPreview };
export { PluginOpts as DendronPreviewOpts };
