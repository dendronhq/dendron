import { ProtoLink, DEngine, DNodeUtils } from "@dendronhq/common-all";
import _ from "lodash";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { WikiLinkData } from "./dendronLinksPlugin";

export type ReplaceRefOptions = {
  refReplacements?: { [key: string]: ProtoLink };
  imageRefPrefix?: string;
  wikiLink2Md?: boolean;
  wikiLink2Html?: boolean;
  wikiLinkPrefix?: string;
  wikiLinkUseId?: boolean;
  engine?: DEngine;
  toHTML?: boolean;
};

export function replaceRefs(options: ReplaceRefOptions) {
  const {
    imageRefPrefix,
    wikiLink2Md,
    wikiLink2Html,
    wikiLinkPrefix,
    wikiLinkUseId,
    engine,
  } = _.defaults(options, {
    refReplacements: {},
    wikiLinkPrefix: false,
    wikiLink2Html: false,
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
        if (wikiLink2Html) {
          data.toHTML = true;
        }
        if (wikiLinkPrefix) {
          data.prefix = wikiLinkPrefix;
        }
        if (wikiLinkUseId) {
          data.useId = true;
          if (!engine) {
            throw Error(`need engine when wikiLinkUseId is set`);
          }
          data.note = DNodeUtils.getNoteByFname(data.permalink, engine, {
            throwIfEmpty: true,
          });
        }
      }
    });
    return tree;
  }
  return transformer;
}
