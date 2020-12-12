import { DendronError, DEngineClientV2 } from "@dendronhq/common-all";
import remark from "remark";
import frontmatterPlugin from "remark-frontmatter";
import Unified from "unified";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";
import _ from "lodash";
import { Node } from "unist";
import { Heading } from "mdast";
import { noteRefs, NoteRefsOpts } from "./remark/noteRefs";
import { DendronASTDest } from "./types";
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
      .data("errors", errors)
      .data("engine", engine)
      //.use(markdownParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"]);
    return _proc;
  }

  static procFull(
    opts: ProcOpts & {
      dest: DendronASTDest;
      wikiLinksOpts?: WikiLinksOpts;
      noteRefOpts?: NoteRefsOpts;
    }
  ) {
    const { dest } = opts;
    const proc = this.proc(opts)
      .use(wikiLinks, opts.wikiLinksOpts || { dest })
      .use(noteRefs, opts.noteRefOpts || { dest });
    return proc;
  }
}
