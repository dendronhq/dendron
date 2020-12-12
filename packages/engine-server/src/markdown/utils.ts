import { DendronError, DEngineClientV2 } from "@dendronhq/common-all";
import remark from "remark";
import frontmatterPlugin from "remark-frontmatter";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";

type ProcOpts = {
  engine: DEngineClientV2;
};

export class MDUtilsV4 {
  static proc(opts: ProcOpts) {
    const { engine } = opts;
    const errors: DendronError[] = [];
    let _proc = remark()
      .data("errors", errors)
      .data("engine", engine)
      //.use(markdownParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"]);
    return _proc;
  }

  static procFull(opts: ProcOpts & { wikiLinksOpts?: WikiLinksOpts }) {
    const proc = this.proc(opts).use(wikiLinks, opts.wikiLinksOpts);
    return proc;
  }
}
