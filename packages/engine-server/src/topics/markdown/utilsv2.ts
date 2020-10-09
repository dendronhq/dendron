import {
  DLink,
  DNoteLoc,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import remark from "remark";
import abbrPlugin from "remark-abbr";
import frontmatterPlugin from "remark-frontmatter";
import markdownParse from "remark-parse";
import {
  DendronLinksOpts,
  dendronLinksPlugin,
  WikiLinkNote,
} from "./plugins/dendronLinksPlugin";
import {
  root as mdastRoot,
  paragraph,
  text,
  heading,
  brk,
} from "mdast-builder";

const selectAll = require("unist-util-select").selectAll;

export class ParserUtilsV2 {
  static createWikiLinkRE(opts?: { oldLink: string }) {
    const { oldLink } = opts || {};
    if (oldLink) {
      const match = ParserUtilsV2.escapeForRegExp(oldLink);
      return `\\[\\[\\s*?(.*\\|)?\\s*${match}\\s*\\]\\]`;
    }
    return "\\[\\[\\s*?(.*\\|)?\\s*(?<name>.*)\\s*\\]\\]";
  }

  /**
   * - parse frontmatter
   * - parse wiki links
   * @param opts
   */
  static getRemark(opts?: { dendronLinksOpts: DendronLinksOpts }) {
    const { dendronLinksOpts } = _.defaults(opts, { dendronLinksOpts: {} });
    return remark()
      .use(markdownParse, { gfm: true })
      .use(abbrPlugin)
      .use(frontmatterPlugin, ["yaml"])
      .use(dendronLinksPlugin, dendronLinksOpts)
      .use({ settings: { listItemIndent: "1", fences: true } });
  }

  static findLinks({ note }: { note: NotePropsV2 }): DLink[] {
    const content = note.body;
    let remark = ParserUtilsV2.getRemark();
    //const out = remark.processSync(content);
    let out = remark.parse(content);
    let out2: WikiLinkNote[] = selectAll("wikiLink", out);
    const dlinks = out2.map(
      (m: WikiLinkNote) =>
        ({
          type: "wiki",
          from: NoteUtilsV2.toLoc(note),
          original: m.value,
          value: m.value,
          alias: m.data.alias,
          pos: { start: m.position?.start.offset, end: m.position?.end.offset },
          to: {
            fname: m.value,
          },
        } as DLink)
    );
    return dlinks as DLink[];
  }

  static escapeForRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  static genMDError(opts: { msg: string; title: string }) {
    const { msg, title } = opts;
    return mdastRoot([
      heading(3, text(title)),
      paragraph([paragraph(text(msg)), brk]),
    ]);
  }

  static async replaceLinks(opts: {
    content: string;
    from: DNoteLoc;
    to: DNoteLoc;
  }) {
    const { content, from, to } = opts;
    let remark = ParserUtilsV2.getRemark({
      dendronLinksOpts: {
        replaceLink: { from, to },
      },
    });
    const out = await remark.process(content);
    return out.toString();
  }
}
