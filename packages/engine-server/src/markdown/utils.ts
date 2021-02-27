import {
  DendronConfig,
  DendronError,
  DEngineClientV2,
  DNoteLoc,
  DVault,
  GetNoteOpts,
  getSlugger,
  NotePropsDictV2,
  NotePropsV2,
  NoteUtilsV2,
  VaultUtils,
} from "@dendronhq/common-all";
// @ts-ignore
import mermaid from "@dendronhq/remark-mermaid";
// @ts-ignore
import rehypePrism from "@mapbox/rehype-prism";
import _ from "lodash";
import { Heading } from "mdast";
import { paragraph, root, text } from "mdast-builder";
import nunjucks from "nunjucks";
import link from "rehype-autolink-headings";
// @ts-ignore
import katex from "rehype-katex";
import raw from "rehype-raw";
import slug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remark from "remark";
import abbrPlugin from "remark-abbr";
import footnotes from "remark-footnotes";
import frontmatterPlugin from "remark-frontmatter";
import math from "remark-math";
import remarkParse from "remark-parse";
import remark2rehype from "remark-rehype";
import remarkStringify from "remark-stringify";
// @ts-ignore
import variables from "remark-variables";
import { default as unified, default as Unified, Processor } from "unified";
import { Node, Parent } from "unist";
import { backlinks } from "./remark/backlinks";
import { dendronPub, DendronPubOpts } from "./remark/dendronPub";
import { noteRefs, NoteRefsOpts } from "./remark/noteRefs";
import { noteRefsV2 } from "./remark/noteRefsV2";
import { transformLinks } from "./remark/transformLinks";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";
import { DendronASTData, DendronASTDest } from "./types";

const toString = require("mdast-util-to-string");
export { nunjucks };

type ProcOpts = {
  engine: DEngineClientV2;
};

type ProcParseOpts = {
  dest: DendronASTDest;
} & ProcOpts;

type ProcOptsFull = ProcOpts & {
  dest: DendronASTDest;
  shouldApplyPublishRules?: boolean;
  vault: DVault;
  fname: string;
  config?: DendronConfig;
  mathOpts?: {
    katex?: boolean;
  };
  mermaid?: boolean;
  noteRefLvl?: number;
  usePrettyRefs?: boolean;
  // shouldn't need to be used
  wikiLinksOpts?: WikiLinksOpts;
  noteRefOpts?: NoteRefsOpts;
  publishOpts?: DendronPubOpts;
};

enum DendronProcDataKeys {
  PROC_OPTS = "procOpts",
  NOTE_REF_LVL = "noteRefLvl",
  ENGINE = "engine",
}

export const renderFromNoteProps = (
  opts: { notes: NotePropsDictV2 } & GetNoteOpts
) => {
  const note = NoteUtilsV2.getNoteByFnameV5(opts);
  if (!note) {
    throw Error("no note found");
  }
  return renderFromNote({ note });
};

export const renderFromNote = (opts: { note: NotePropsV2 }) => {
  const { note } = opts;
  const contents = nunjucks.renderString(note.body, {
    fm: { ...note.custom, title: note.title },
    fname: note.fname,
  });
  return contents;
};

export const renderFromNoteWithCustomBody = (opts: {
  note: NotePropsV2;
  body: string;
}) => {
  const { note, body } = opts;
  const contents = nunjucks.renderString(body, { fm: note.custom });
  return contents;
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

  static getVault(proc: Processor, vaultName?: string) {
    let { vault } = MDUtilsV4.getDendronData(proc);
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    if (vaultName) {
      vault = VaultUtils.getVaultByName({
        vaults: engine.vaultsv3,
        vname: vaultName,
        throwOnMissing: true,
      })!;
    }
    return vault;
  }

  static getFM(proc: Processor) {
    return proc.data("fm") as any;
  }

  static setDendronData(proc: Processor, data: Partial<DendronASTData>) {
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
    return this.getProcOpts(proc).noteRefLvl || 0;
  }

  static getProcOpts(proc: Unified.Processor) {
    const procOpts = proc.data(DendronProcDataKeys.PROC_OPTS) as ProcOptsFull;
    return procOpts;
  }

  static setEngine(proc: Unified.Processor, engine: DEngineClientV2) {
    proc.data(DendronProcDataKeys.ENGINE, engine);
  }

  static setNoteRefLvl(proc: Unified.Processor, lvl: number) {
    this.setProcOpts(proc, { noteRefLvl: lvl });
  }

  static setProcOpts(proc: Unified.Processor, data: Partial<ProcOptsFull>) {
    const procOpts = proc.data(DendronProcDataKeys.PROC_OPTS) as ProcOptsFull;
    return proc.data(DendronProcDataKeys.PROC_OPTS, { ...procOpts, ...data });
  }

  // @deprecate
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

  static matchHeading(
    node: Node,
    text: string,
    opts: { depth?: number; slugger: ReturnType<typeof getSlugger> }
  ) {
    const { depth, slugger } = opts;
    if (node.type !== "heading") {
      return false;
    }

    // wildcard is always true
    if (text === "*") {
      return true;
    }

    if (text) {
      var headingText = toString(node);
      return text.trim().toLowerCase() === slugger.slug(headingText.trim());
    }

    if (depth) {
      return (node as Heading).depth <= depth;
    }

    return true;
  }

  /**
   * Get remark processor with a few default plugins
   */
  static remark() {
    let _proc = remark()
      .use(remarkParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"])
      .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } });
    return _proc;
  }

  /**
   * Simple proc just for parsing docs
   */
  static procParse(opts: ProcParseOpts) {
    const errors: DendronError[] = [];
    let _proc = remark()
      .use(remarkParse, { gfm: true })
      .use(wikiLinks)
      .data("errors", errors);
    this.setDendronData(_proc, { dest: opts.dest });
    this.setEngine(_proc, opts.engine);
    return _proc;
  }

  /**
   * Used to build other proces from
   */
  static proc(opts: ProcOpts) {
    const { engine } = opts;
    const errors: DendronError[] = [];
    let _proc = remark()
      .use(remarkParse, { gfm: true })
      .data("errors", errors)
      .data("engine", engine)
      .use(frontmatterPlugin, ["yaml"])
      .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } });
    this.setProcOpts(_proc, opts);
    return _proc;
  }

  static procFull(opts: ProcOptsFull) {
    const { dest, vault, fname, shouldApplyPublishRules, engine } = opts;
    const config = opts.config || engine.config;
    let proc = this.proc(opts);
    if (vault && fname) {
      const engine = MDUtilsV4.getEngineFromProc(proc).engine;
      const note = NoteUtilsV2.getNoteByFnameV5({
        fname,
        notes: engine.notes,
        vault,
        wsRoot: engine.wsRoot,
      });
      const fm = {
        ...note?.custom,
        title: note?.title,
      };
      proc = proc.data("fm", fm);
    }

    // set defaults
    let usePrettyRefs: boolean | undefined = _.find(
      [opts.usePrettyRefs, config?.usePrettyRefs, config?.site?.usePrettyRefs],
      (ent) => !_.isUndefined(ent)
    );
    if (_.isUndefined(usePrettyRefs)) {
      usePrettyRefs = true;
    }

    proc = proc
      .data("dendron", {
        dest,
        vault,
        fname,
        config,
        shouldApplyPublishRules,
      } as DendronASTData)
      //.use(extract, { name: "fm" })
      .use(abbrPlugin)
      .use(variables)
      .use(footnotes)
      .use(wikiLinks, opts.wikiLinksOpts)
      .use(backlinks)
      .use(noteRefsV2, {
        ...opts.noteRefOpts,
        wikiLinkOpts: opts.wikiLinksOpts,
        prettyRefs: usePrettyRefs,
      })
      .use(noteRefs, { ...opts.noteRefOpts, wikiLinkOpts: opts.wikiLinksOpts });
    if (opts.mathOpts?.katex) {
      proc = proc.use(math);
    }
    if (opts.mermaid) {
      proc = proc.use(mermaid, { simple: true });
    }
    // MD_DENDRON, convert back to itself, no need for transformations
    if (dest !== DendronASTDest.MD_DENDRON) {
      proc = proc.use(dendronPub, {
        ...opts.publishOpts,
        wikiLinkOpts: opts.wikiLinksOpts,
        prettyRefs: usePrettyRefs,
      });
    }
    proc = proc.data("procFull", proc().freeze());
    proc = proc.data(DendronProcDataKeys.PROC_OPTS, opts);
    return proc;
  }

  /**
   * Just parse markdown
   */
  static procRemark(opts: { proc?: Processor }) {
    const { proc } = opts;
    let _proc = proc || this.remark();
    return _proc.use(remarkParse, { gfm: true }).use(remarkStringify);
  }

  /**
   * markdown -> html
   */
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
      .use(rehypePrism, { ignoreMissing: true })
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

  /**
   * Used to refactor text
   */
  static procTransform(
    procOpts: Omit<ProcOptsFull, "dest">,
    transformOpts: { from: DNoteLoc; to: DNoteLoc }
  ) {
    const proc = this.procFull({
      dest: DendronASTDest.MD_DENDRON,
      ...procOpts,
    });
    return proc.use(transformLinks, transformOpts);
  }
}
