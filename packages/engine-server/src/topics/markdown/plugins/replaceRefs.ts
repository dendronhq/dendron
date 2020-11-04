import { DEngineClientV2, NoteUtilsV2 } from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { WikiLinkData } from "./dendronLinksPlugin";

export type ReplaceRefOptions = {
  imageRefPrefix?: string;
  wikiLink2Md?: boolean;
  wikiLink2Html?: boolean;
  wikiLinkPrefix?: string;
  wikiLinkUseId?: boolean;
  engine?: DEngineClientV2;
  toHTML?: boolean;
  /**
   * used for links in preview
   */
  forNoteRefInPreview?: boolean;
  /**
   * used for links in published site
   */
  forNoteRefInSite?: boolean;
  missingLinkBehavior?: "raiseError" | "404";
  /**
   * Write errors that have occured
   */
  scratch?: string;
};

export function replaceRefs(options: ReplaceRefOptions) {
  const {
    imageRefPrefix,
    wikiLink2Md,
    wikiLink2Html,
    wikiLinkPrefix,
    wikiLinkUseId,
    engine,
    missingLinkBehavior,
    forNoteRefInPreview,
    forNoteRefInSite,
    scratch,
  } = _.defaults(options, {
    wikiLinkPrefix: false,
    wikiLink2Html: false,
    missingLinkBehavior: "404",
    forNoteRefInPreview: false,
    forNoteRefInSite: true,
  });
  function transformer(tree: Node, _file: VFile) {
    visit(tree, (node) => {
      if (node.type === "image") {
        if (imageRefPrefix) {
          node.url = imageRefPrefix + node.url;
        }
      }
      if (node.type === "wikiLink") {
        const data = node.data as WikiLinkData;
        if (wikiLink2Md) {
          data.toMd = true;
        }
        if (forNoteRefInPreview) {
          data.forNoteRefInPreview = true;
        }
        if (forNoteRefInSite) {
          data.forNoteRefInSite = true;
        }
        if (wikiLink2Html) {
          data.toHTML = true;
        }
        if (wikiLinkPrefix) {
          data.prefix = wikiLinkPrefix;
        }
        // use id-based link
        if (wikiLinkUseId) {
          data.useId = true;
          if (!engine) {
            throw Error(`need engine when wikiLinkUseId is set`);
          }
          const throwIfEmpty = missingLinkBehavior === "raiseIfError";
          data.note = NoteUtilsV2.getNoteByFname(
            data.permalink,
            (engine as DEngineClientV2).notes,
            {
              throwIfEmpty,
            }
          );
          if (_.isUndefined(data.note) && missingLinkBehavior === "404") {
            // @ts-ignore
            data.note = { id: "/404.html" };
            delete data["prefix"];
            // add id to bad links
            if (scratch) {
              fs.appendFileSync(scratch, data.permalink + "\n", {
                encoding: "utf8",
              });
            }
          }
        }
      }
    });
    return tree;
  }
  return transformer;
}
