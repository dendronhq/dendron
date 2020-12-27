import { DendronError, DEngineClientV2, DVault } from "@dendronhq/common-all";
import _ from "lodash";
import { Heading } from "mdast";
import { paragraph, root, text } from "mdast-builder";
// @ts-ignore
import katex from "rehype-katex";
import raw from "rehype-raw";
import rehypeStringify from "rehype-stringify";
import remark from "remark";
import frontmatterPlugin from "remark-frontmatter";
import math from "remark-math";
import remarkParse from "remark-parse";
import remark2rehype from "remark-rehype";
import { default as unified, default as Unified, Processor } from "unified";
import { Node, Parent } from "unist";
import { dendronPub, DendronPubOpts } from "./remark/dendronPub";
import { noteRefs, NoteRefsOpts } from "./remark/noteRefs";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";
import { DendronASTData, DendronASTDest } from "./types";
// @ts-ignore
import highlight from "remark-highlight.js";

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

  static genMDMsg(msg: string): Parent {
    return root(paragraph(text(msg)));
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
      mathOpts?: {
        katex?: boolean;
      };
    }
  ) {
    const { dest, vault } = opts;
    let proc = this.proc(opts)
      .data("dendron", { dest, vault } as DendronASTData)
      .use(wikiLinks, opts.wikiLinksOpts)
      .use(noteRefs, { ...opts.noteRefOpts, wikiLinkOpts: opts.wikiLinksOpts });
    if (opts.mathOpts?.katex) {
      proc = proc.use(math);
    }
    // if (dest === DendronASTDest.HTML) {
    proc = proc.use(dendronPub, {
      ...opts.publishOpts,
      wikiLinkOpts: opts.wikiLinksOpts,
    });
    proc = proc.data("procFull", proc().freeze());
    return proc;
    //return proc;
  }

  static procRehype(opts: {
    proc?: Processor;
    mdPlugins?: Processor[];
    mathjax?: boolean;
  }) {
    const { proc, mdPlugins } = _.defaults(opts, { mdPlugins: [] });
    let _proc = proc || unified().use(remarkParse, { gfm: true });
    _proc = _proc.use(highlight);
    mdPlugins.forEach((p) => {
      _proc = _proc.use(p);
    });
    _proc = _proc.use(remark2rehype, { allowDangerousHtml: true }).use(raw);
    if (opts.mathjax) {
      _proc = _proc.use(katex);
    }
    return _proc.use(rehypeStringify);
  }
}
