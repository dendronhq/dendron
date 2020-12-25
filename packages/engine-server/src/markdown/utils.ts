import { DendronError, DEngineClientV2, DVault } from "@dendronhq/common-all";
import _ from "lodash";
import { Heading } from "mdast";
import raw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remark from "remark";
import frontmatterPlugin from "remark-frontmatter";
import remarkParse from "remark-parse";
import remark2rehype from "remark-rehype";
import unified from "unified";
import Unified, { Processor } from "unified";
import { Node } from "unist";
import { dendronPub, DendronPubOpts } from "./remark/dendronPub";
import { noteRefs, NoteRefsOpts } from "./remark/noteRefs";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";
import { DendronASTData, DendronASTDest } from "./types";
import math from "remark-math";
import mathjax from "rehype-mathjax";
const toString = require("mdast-util-to-string");

type ProcOpts = {
  engine: DEngineClientV2;
};

export class MDUtilsV4 {
  static findIndex(array: Node[], fn: any) {
    for (var i = 0; i < array.length; i++) {
      if (fn(array[i], i)) {
        return i;
      }
    }
    return -1;
  }

  static getDendronData(proc: Processor) {
    return proc.data("dendron") as DendronASTData;
  }

  static setDendronData(proc: Processor, data: DendronASTData) {
    const _data = proc.data("dendron") as DendronASTData;
    return proc.data("dendron", { ..._data, ...data });
  }

  static getEngineFromProc(proc: Unified.Processor) {
    const engine = proc.data("engine") as DEngineClientV2;
    let error: DendronError | undefined;
    if (_.isUndefined(engine) || _.isNull(engine)) {
      error = new DendronError({ msg: "engine not defined" });
    }
    return {
      error,
      engine,
    };
  }

  static getNoteRefLvl(proc: Unified.Processor): number {
    return (proc.data("noteRefLvl") as number) || 0;
  }

  static setNoteRefLvl(proc: Unified.Processor, lvl: number) {
    return proc.data("noteRefLvl", lvl);
  }

  static isHeading(node: Node, text: string, depth?: number) {
    if (node.type !== "heading") {
      return false;
    }

    // wildcard is always true
    if (text === "*") {
      return true;
    }
    if (text) {
      var headingText = toString(node);
      return text.trim().toLowerCase() === headingText.trim().toLowerCase();
    }

    if (depth) {
      return (node as Heading).depth <= depth;
    }

    return true;
  }
  static proc(opts: ProcOpts) {
    const { engine } = opts;
    const errors: DendronError[] = [];
    let _proc = remark()
      .use(remarkParse, { gfm: true })
      .data("errors", errors)
      .data("engine", engine)
      .use(frontmatterPlugin, ["yaml"])
      .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } });
    return _proc;
  }

  static procFull(
    opts: ProcOpts & {
      dest: DendronASTDest;
      vault?: DVault;
      wikiLinksOpts?: WikiLinksOpts;
      noteRefOpts?: NoteRefsOpts;
      publishOpts?: DendronPubOpts;
    }
  ) {
    const { dest, vault } = opts;
    const proc = this.proc(opts)
      .data("dendron", { dest, vault } as DendronASTData)
      .use(wikiLinks, opts.wikiLinksOpts)
      .use(noteRefs, { ...opts.noteRefOpts, wikiLinkOpts: opts.wikiLinksOpts });
    if (dest === DendronASTDest.HTML) {
      return proc.use(dendronPub, opts.publishOpts);
    }
    return proc;
  }

  static procRehype(opts: {
    proc?: Processor;
    mdPlugins?: Processor[];
    mathjax?: boolean;
  }) {
    const { proc, mdPlugins } = _.defaults(opts, { mdPlugins: [] });
    let _proc = proc || unified().use(remarkParse, { gfm: true });
    mdPlugins.forEach((p) => {
      _proc.use(p);
    });
    if (opts.mathjax) {
      _proc.use(math);
    }
    _proc.use(remark2rehype, { allowDangerousHtml: true }).use(raw);
    if (opts.mathjax) {
      _proc.use(mathjax);
    }
    return _proc.use(rehypeStringify);
  }
}
