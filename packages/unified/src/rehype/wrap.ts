import type { Processor, Plugin } from "unified";
import visit from "unist-util-visit";
import type { Node } from "unist";
// @ts-ignore
import type { HastNode } from "hast-util-select";
// @ts-ignore
import parseSelector from "hast-util-parse-selector";
// @ts-ignore
import { selectAll } from "hast-util-select";

type PluginOpts = {
  wrapper: string;
  selector: string;
  fallback?: boolean;
};

const plugin: Plugin<[PluginOpts]> = function plugin(this: Processor, opts) {
  function transformer(tree: Node): void {
    const root = tree as HastNode;
    for (const match of selectAll(opts.selector, root)) {
      const wrapper = parseSelector(opts.wrapper);
      visit(tree, match, (node, i, parent) => {
        wrapper.children = [node];
        if (parent) {
          parent.children[i] = wrapper;
        }
      });
    }
  }
  return transformer;
};

export { plugin as wrap };
