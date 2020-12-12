import {
  DendronError,
  DEngineClientV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import fs from "fs-extra";
import _ from "lodash";
import { Node } from "unist";
import visit from "unist-util-visit";
import { VFile } from "vfile";
import { WikiLinkData } from "./types";

export type ReplaceRefOptions = {
  imageRefPrefix?: string;
  wikiLink2Md?: boolean;
  wikiLink2Html?: boolean;
  wikiLinkPrefix?: string;
  /**
   * Use the note id for the link
   */
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

export function handleMissingWikiLink(opts: {
  data: WikiLinkData;
  scratch: string;
  msg: string;
}) {
  const { data, scratch, msg } = opts;
  data.note = { id: "/404.html" };
  delete data["prefix"];
  // add id to bad links
  if (scratch) {
    fs.appendFileSync(scratch, [data.permalink, msg].join(":") + "\n", {
      encoding: "utf8",
    });
  }
}

/**
 * Used in refactoring, renaming and publishing
 */
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
          const notes = NoteUtilsV2.getNotesByFname({
            fname: data.permalink,
            notes: (engine as DEngineClientV2).notes,
          });
          let errorMsg: string | undefined;
          if (notes.length < 1) {
            errorMsg = `no note found for following link: ${data.permalink}`;
          } else if (notes.length > 1) {
            errorMsg = `multiple notes found for following link: ${data.permalink}`;
          } else {
            data.note = notes[0];
          }
          // check for error
          if (_.isUndefined(data.note)) {
            if (missingLinkBehavior === "404") {
              handleMissingWikiLink({ data, scratch, msg: errorMsg! });
            } else {
              throw new DendronError({ msg: errorMsg });
            }
          }
        }
      }
    });
    return tree;
  }
  return transformer;
}
