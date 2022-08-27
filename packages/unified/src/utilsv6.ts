import { DendronError, NoteProps } from "@dendronhq/common-all";
// @ts-ignore
// @ts-ignore
// @ts-ignore
// @ts-ignore
import remark from "remark";
import abbrPlugin from "remark-abbr";
import frontmatterPlugin from "remark-frontmatter";
import remarkParse from "remark-parse";
import { hashtags } from "./remark/hashtag";
import { noteRefsV2 } from "./remark/noteRefsV2";
import { userTags } from "./remark/userTags";
import { wikiLinks } from "./remark/wikiLinks";

export type procDataGathererOpts = {};
/**
 * Used for processing a Dendron markdown note
 */
export function procDataGatherer(noteToRender: NoteProps) {
  const errors: DendronError[] = [];
  const proc = remark()
    .use(remarkParse, { gfm: true })
    .use(frontmatterPlugin, ["yaml"])
    .use(abbrPlugin)
    .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } })
    .use(noteRefsV2)
    // .use(blockAnchors)
    .use(hashtags)
    .use(userTags)

    // .use(extendedImage)
    // .use(footnotes)
    // .use(variables)
    // .use(backlinksHover, data.backlinkHoverOpts)
    .use(wikiLinks)
    .data("errors", errors);

  proc.data("procDataGatherer", { noteToRender });

  // set options and do validation
  // proc = this.setProcOpts(proc, opts);

  return proc;
}
