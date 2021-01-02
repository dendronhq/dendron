import {
  DendronError,
  DEngineClientV2,
  DVault,
  NoteUtilsV2,
} from "@dendronhq/common-all";
// @ts-ignore
import rehypePrism from "@mapbox/rehype-prism";
import _ from "lodash";
import { Heading } from "mdast";
import { paragraph, root, text } from "mdast-builder";
import link from "rehype-autolink-headings";
// @ts-ignore
import katex from "rehype-katex";
import raw from "rehype-raw";
import slug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remark from "remark";
// @ts-ignore
import variables from "remark-variables";
import frontmatterPlugin from "remark-frontmatter";
import math from "remark-math";
import remarkParse from "remark-parse";
import remark2rehype from "remark-rehype";
import remarkStringify from "remark-stringify";
import { default as unified, default as Unified, Processor } from "unified";
import { Node, Parent } from "unist";
import { dendronPub, DendronPubOpts } from "./remark/dendronPub";
import { noteRefs, NoteRefsOpts } from "./remark/noteRefs";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";
import { DendronASTData, DendronASTDest } from "./types";
import abbrPlugin from "remark-abbr";

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

  static remark() {
    let _proc = remark()
      .use(remarkParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"])
      .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } });
    return _proc;
  }

  static proc(opts: ProcOpts) {
    const { engine } = opts;
    const errors: DendronError[] = [];
    let _proc = remark()
      .use(remarkParse, { gfm: true })
      //.use(remarkStringify)
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
      fname?: string;
      wikiLinksOpts?: WikiLinksOpts;
      noteRefOpts?: NoteRefsOpts;
      publishOpts?: DendronPubOpts;
      mathOpts?: {
        katex?: boolean;
      };
    }
  ) {
    const { dest, vault, fname } = opts;
    let proc = this.proc(opts);
    if (vault && fname) {
      const engine = MDUtilsV4.getEngineFromProc(proc).engine;
      const note = NoteUtilsV2.getNoteByFnameV4({
        fname,
        notes: engine.notes,
        vault,
      });
      const fm = {
        ...note?.custom,
        title: note?.title,
      };
      proc = proc.data("fm", fm);
    }
    proc = proc
      .data("dendron", { dest, vault, fname } as DendronASTData)
      //.use(extract, { name: "fm" })
      .use(abbrPlugin)
      .use(variables)
      .use(wikiLinks, opts.wikiLinksOpts)
      .use(noteRefs, { ...opts.noteRefOpts, wikiLinkOpts: opts.wikiLinksOpts });
    if (opts.mathOpts?.katex) {
      proc = proc.use(math);
    }
    // MD_DENDRON, convert back to itself, no need for transformations
    if (dest !== DendronASTDest.MD_DENDRON) {
      proc = proc.use(dendronPub, {
        ...opts.publishOpts,
        wikiLinkOpts: opts.wikiLinksOpts,
      });
    }
    proc = proc.data("procFull", proc().freeze());
    return proc;
  }

  static procRemark(opts: { proc?: Processor }) {
    const { proc } = opts;
    let _proc = proc || this.remark();
    return _proc.use(remarkParse, { gfm: true }).use(remarkStringify);
  }

  static procRehype(opts: {
    proc?: Processor;
    mdPlugins?: Processor[];
    mathjax?: boolean;
  }) {
    const { proc, mdPlugins } = _.defaults(opts, { mdPlugins: [] });
    let _proc = proc || unified().use(remarkParse, { gfm: true });
    mdPlugins.forEach((p) => {
      _proc = _proc.use(p);
    });
    _proc = _proc
      .use(remark2rehype, { allowDangerousHtml: true })
      .use(rehypePrism)
      .use(raw)
      .use(slug)
      .use(link, {
        properties: {
          "aria-hidden": "true",
          class: "anchor-heading",
        },
        content: {
          type: "element",
          tagName: "svg",
          properties: {
            "aria-hidden": "true",
            viewBox: "0 0 16 16",
          },
          children: [
            {
              type: "element",
              tagName: "use",
              properties: {
                "xlink:href": "#svg-link",
              },
            },
          ],
        },
      });
    if (opts.mathjax) {
      _proc = _proc.use(katex);
    }
    return _proc.use(rehypeStringify);
  }
}
