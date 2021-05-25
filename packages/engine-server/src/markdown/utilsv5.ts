import { DendronError } from "@dendronhq/common-all";
import remark from "remark";
import remarkParse from "remark-parse";
import frontmatterPlugin from "remark-frontmatter";
import abbrPlugin from "remark-abbr";
import { wikiLinks } from "./remark/wikiLinks";
import { Processor } from "./types";

type ProcOptsV5 = {
  /**
   * Use raw value
   */
  useRaw?: boolean;
};

type DendronASTDataV5 = {} & ProcOptsV5;

export class MDUtilsV5 {
  static getProcOpts(proc: Processor): DendronASTDataV5 {
    const _data = proc.data("dendronv5") as DendronASTDataV5;
    return _data || {};
  }

  static setProcOpts(proc: Processor, opts: ProcOptsV5) {
    const _data = proc.data("dendronv5") as DendronASTDataV5;
    return proc.data("dendronv5", { ..._data, ...opts });
  }

  /**
   * Used for parsing a note.
   * Does not have engine properties
   * @returns
   */
  static procRemarkParse() {
    const errors: DendronError[] = [];
    let proc = remark()
      .use(remarkParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"])
      .use(abbrPlugin)
      .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } })
      .use(wikiLinks)
      .data("errors", errors);
    proc = this.setProcOpts(proc, { useRaw: true });
    return proc;
  }
}
