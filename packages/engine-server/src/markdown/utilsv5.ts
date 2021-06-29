import {
  DendronConfig,
  DendronError,
  DEngineClient,
  DVault,
  ERROR_STATUS,
} from "@dendronhq/common-all";
// @ts-ignore
import rehypePrism from "@mapbox/rehype-prism";
import _ from "lodash";
import link from "rehype-autolink-headings";
// @ts-ignore
import katex from "rehype-katex";
import raw from "rehype-raw";
import slug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remark from "remark";
import abbrPlugin from "remark-abbr";
import frontmatterPlugin from "remark-frontmatter";
import remarkParse from "remark-parse";
import remark2rehype from "remark-rehype";
import { Processor } from "unified";
import { blockAnchors } from "./remark/blockAnchors";
import { dendronPub } from "./remark/dendronPub";
import { noteRefsV2 } from "./remark/noteRefsV2";
import { wikiLinks } from "./remark/wikiLinks";
import { DendronASTDest } from "./types";
import { MDUtilsV4 } from "./utils";

/**
 * What mode a processor should run in
 */
export enum ProcMode {
  /**
   * Expect no properties from {@link ProcDataFullV5} when running the processor
   */
  NO_DATA = "NO_DATA",
  /**
   * Expect all properties from {@link ProcDataFullV5} when running the processor
   */
  FULL = "all data",
}

/**
 * Options for how processor should function
 */
export type ProcOptsV5 = {
  /**
   * Determines what information is passed in to `Proc`
   */
  mode: ProcMode;
  /**
   * Don't attach compiler if `parseOnly`
   */
  parseOnly?: boolean;
  /**
   * Check if processor should take into account publishing rules
   */
  publishing?: boolean;
};

/**
 * Data to initialize the processor
 */
export type ProcDataFullOptsV5 = {
  engine?: DEngineClient;
  vault?: DVault;
  fname?: string;
  dest: DendronASTDest;
} & { config?: DendronConfig };

/**
 * Data from the processor
 */
export type ProcDataFullV5 = {
  engine: DEngineClient;
  vault: DVault;
  fname: string;
  config: DendronConfig;
  dest: DendronASTDest;
  /**
   * Keep track of current note ref level
   */
  noteRefLvl: number;
};

export class MDUtilsV5 {
  static getProcOpts(proc: Processor): ProcOptsV5 {
    const _data = proc.data("dendronProcOptsv5") as ProcOptsV5;
    return _data || {};
  }

  static setProcOpts(proc: Processor, opts: ProcOptsV5) {
    const _data = proc.data("dendronProcOptsv5") as ProcOptsV5;
    return proc.data("dendronProcOptsv5", { ..._data, ...opts });
  }

  static getProcData(proc: Processor): ProcDataFullV5 {
    let _data = proc.data("dendronProcDatav5") as ProcDataFullV5;

    // backwards compatibility
    _data = _.defaults(MDUtilsV4.getDendronData(proc), _data);
    try {
      _data.noteRefLvl = MDUtilsV4.getNoteRefLvl(proc);
    } catch {
      _data.noteRefLvl = 0;
    }
    return _data || {};
  }

  static setProcData(proc: Processor, opts: Partial<ProcDataFullV5>) {
    const _data = proc.data("dendronProcDatav5") as ProcDataFullV5;
    // TODO: for backwards compatibility
    MDUtilsV4.setProcOpts(proc, opts);
    MDUtilsV4.setDendronData(proc, opts);
    return proc.data("dendronProcDatav5", { ..._data, ...opts });
  }

  static isV5Active(proc: Processor) {
    return !_.isUndefined(this.getProcOpts(proc).mode);
  }

  static shouldApplyPublishingRules(proc: Processor): boolean {
    return (
      this.getProcData(proc).dest === DendronASTDest.HTML &&
      this.getProcOpts(proc).publishing !== true
    );
  }

  static shouldApplyPublishingRules(proc: Processor): boolean {
    return (
      this.getProcData(proc).dest === DendronASTDest.HTML &&
      this.getProcOpts(proc).publishing !== true
    );
  }

  /**
   * Used for processing a Dendron markdown note
   */
  static _procRemark(opts: ProcOptsV5, data: Partial<ProcDataFullOptsV5>) {
    const errors: DendronError[] = [];
    let proc = remark()
      .use(dendronPub)
      .use(remarkParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"])
      .use(abbrPlugin)
      .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } })
      .use(noteRefsV2)
      .use(wikiLinks)
      .use(blockAnchors)
      .data("errors", errors);

    // set options and do validation
    proc = this.setProcOpts(proc, opts);
    if (opts.mode === ProcMode.FULL) {
      if (_.isUndefined(data)) {
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_CONFIG,
          message: `data is required when not using raw proc`,
        });
      }
      const requiredProps = ["vault", "engine", "fname", "dest"];
      const hasAllProps = _.map(requiredProps, (prop) => {
        // @ts-ignore
        return !_.isUndefined(data[prop]);
      });
      if (!_.every(hasAllProps)) {
        // @ts-ignore
        const missing = _.filter(requiredProps, (prop) =>
          // @ts-ignore
          _.isUndefined(data[prop])
        );
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_CONFIG,
          message: `missing required fields in data. ${missing.join(
            " ,"
          )} missing`,
        });
      }
      if (!data.config) {
        data.config = data.engine!.config;
      }

      // backwards compatibility, default to v4 values
      data = _.defaults(MDUtilsV4.getDendronData(proc), data);
      this.setProcData(proc, data as ProcDataFullV5);
      MDUtilsV4.setEngine(proc, data.engine!);
      proc = proc.use(dendronPub);
    }
    return proc;
  }

  static _procRehype(opts: ProcOptsV5, data?: Partial<ProcDataFullOptsV5>) {
    const pRemarkParse = this.procRemarkParse(opts, {
      ...data,
      dest: DendronASTDest.HTML,
    });
    let pRehype = pRemarkParse
      .use(remark2rehype, { allowDangerousHtml: true })
      .use(rehypePrism, { ignoreMissing: true })
      .use(raw)
      .use(slug);

    // apply plugins enabled by config
    if (data?.config?.useKatex) {
      pRehype = pRehype.use(katex);
    }
    // apply publishing specific things
    if (opts.publishing) {
      pRehype = pRehype.use(link, {
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
    }
    return pRehype;
  }

  static procRemarkFull(data: ProcDataFullOptsV5) {
    return this._procRemark({ mode: ProcMode.FULL }, data);
  }

  /**
   * Parse Dendron Markdown Note. No compiler is attached.
   * @param opts
   * @param data
   * @returns
   */
  static procRemarkParse(opts: ProcOptsV5, data: ProcDataFullOptsV5) {
    return this._procRemark({ ...opts, parseOnly: true }, data);
  }

  static procRehypeParse(opts: ProcOptsV5, data?: Partial<ProcDataFullOptsV5>) {
    return this._procRemark(
      { ...opts, parseOnly: true },
      { ...data, dest: DendronASTDest.HTML }
    );
  }

  static procRehypeFull(
    data: Omit<ProcDataFullOptsV5, "dest">,
    opts?: { publishing?: boolean }
  ) {
    const proc = this._procRehype(
      { mode: ProcMode.FULL, parseOnly: false, publishing: opts?.publishing },
      data
    );
    return proc.use(rehypeStringify);
  }
}
