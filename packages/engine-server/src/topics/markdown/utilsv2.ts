import {
  DLink,
  DNoteLoc,
  NotePropsV2,
  NoteUtilsV2,
} from "@dendronhq/common-all";
import _ from "lodash";
import remark from "remark";
import frontmatterPlugin from "remark-frontmatter";
import markdownParse from "remark-parse";
import {
  DendronLinksOpts,
  dendronLinksPlugin,
} from "./plugins/dendronLinksPlugin";

export class ParserUtilsV2 {
  static createWikiLinkRE(opts?: { oldLink: string }) {
    const { oldLink } = opts || {};
    if (oldLink) {
      const match = ParserUtilsV2.escapeForRegExp(oldLink);
      return `\\[\\[\\s*?(.*\\|)?\\s*${match}\\s*\\]\\]`;
    }
    return "\\[\\[\\s*?(.*\\|)?\\s*(?<name>.*)\\s*\\]\\]";
  }
  static getRemark(opts?: { dendronLinksOpts: DendronLinksOpts }) {
    const { dendronLinksOpts } = _.defaults(opts, { dendronLinksOpts: {} });
    return remark()
      .use(markdownParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"])
      .use(dendronLinksPlugin, dendronLinksOpts)
      .use({ settings: { listItemIndent: "1", fences: true } });
  }

  static findLinks({ note }: { note: NotePropsV2 }): DLink[] {
    const content = note.body;
    const reWiki = ParserUtilsV2.createWikiLinkRE();
    const wikiLinks = content.matchAll(new RegExp(reWiki, "gi"));
    const wikiLinksMatches = Array.from(wikiLinks, (m) => {
      if (_.isUndefined(m.index)) {
        throw Error("no index found, findLinks");
      }
      if (!m.groups?.name) {
        throw Error("no name found, findLInks");
      }
      return {
        match: m[0],
        value: m.groups.name,
        alias: m.groups?.alias,
        start: m.index,
        end: m.index + m[0].length,
      };
    });
    return wikiLinksMatches.map((m) => ({
      type: "wiki",
      from: NoteUtilsV2.toLoc(note),
      original: m.match,
      value: m.value,
      alias: m?.alias,
      pos: { start: m.start, end: m.end },
      to: {
        fname: m.value,
      },
    }));
  }

  static escapeForRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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
