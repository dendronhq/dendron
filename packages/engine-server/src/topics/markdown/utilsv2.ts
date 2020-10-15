import { DNoteLoc } from "@dendronhq/common-all";
import _ from "lodash";
import remark from "remark";
import frontmatterPlugin from "remark-frontmatter";
import markdownParse from "remark-parse";
import {
  DendronLinksOpts,
  dendronLinksPlugin,
} from "./plugins/dendronLinksPlugin";

export class ParserUtilsV2 {
  static getRemark(opts?: { dendronLinksOpts: DendronLinksOpts }) {
    const { dendronLinksOpts } = _.defaults(opts, { dendronLinksOpts: {} });
    return remark()
      .use(markdownParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"])
      .use(dendronLinksPlugin, dendronLinksOpts)
      .use({ settings: { listItemIndent: "1", fences: true } });
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
