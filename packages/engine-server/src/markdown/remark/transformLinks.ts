import Unified, { Transformer } from "unified";
import { Node } from "unist";
import { VFile } from "vfile";

type PluginOpts = {};

// @ts-ignore
function plugin(this: Unified.Processor, opts?: PluginOpts): Transformer {
  // @ts-ignore
  const proc = this;
  function transformer(tree: Node, _file: VFile) {
    return tree;
  }
  return transformer;
}

export { plugin as replaceLinks };
export { PluginOpts as TransformLinkOpts };
