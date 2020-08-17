import { ProtoLink } from "@dendronhq/common-all/src";
import _ from "lodash";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { WikiLinkData } from "./dendronLinksPlugin";

type ReplaceRefOptions = {
  refReplacements?: { [key: string]: ProtoLink };
  imageRefPrefix?: string;
  wikiLink2Md?: boolean;
  wikiLinkPrefix?: string;
};

export function replaceRefs(options: ReplaceRefOptions) {
  const {
    refReplacements,
    imageRefPrefix,
    wikiLink2Md,
    wikiLinkPrefix,
  } = _.defaults(options, {
    refReplacements: {},
    wikiLinkPrefix: false,
  });
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node) => {
      if (node.type === "image") {
        // const replacement = _.get(refReplacements, node.url as string, false);
        // if (replacement) {
        //   node.url = replacement;
        // }
        if (imageRefPrefix) {
          node.url = imageRefPrefix + node.url;
        }
      }
      if (node.type === "wikiLink") {
        const data = node.data as WikiLinkData;
        if (wikiLink2Md) {
          data.toMd = true;
        }
        if (wikiLinkPrefix) {
          data.prefix = wikiLinkPrefix;
        }
      }
    });
    return tree;
  }
  return transformer;
}
