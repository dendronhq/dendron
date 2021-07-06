import {
  assertUnreachable,
  DendronConfig,
  DendronError,
  DEngineClient,
  DVault,
  ERROR_STATUS,
} from "@dendronhq/common-all";
// @ts-ignore
import rehypePrism from "@mapbox/rehype-prism";
// @ts-ignore
import mermaid from "@dendronhq/remark-mermaid";
import _ from "lodash";
import math from "remark-math";
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
import { dendronPreview } from "./remark/dendronPreview";
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
  /**
   * Running processor in import mode. notes don't exist
   */
  IMPORT = "IMPORT",
}

/**
 * If processor should run in an alternative flavor
 */
export enum ProcFlavor {
  /**
   * No special processing
   */
  REGULAR = "REGULAR",
  /**
   * Apply publishing rules
   */
  PUBLISHING = "PUBLISHING",
  /**
   * Apply preview rules
   */
  PREVIEW = "PREVIEW",
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
   * Are we using specific variant of processor
   */
  flavor?: ProcFlavor;
};

/**
 * Data to initialize the processor
 *
 * @remark You might have picked up that there is a large overlap between optional properties in `ProcData` and what is available with a `Engine`.
 * This is because depending on what `ProcMode` the processor is operating on, we might not have (or need) access to an `engine`
 * instance (eg. when running a doctor command to check for valid markdown syntax )
 * The additional options are also there as an override - letting us override specific engine props without mutating the engine.
 */
export type ProcDataFullOptsV5 = {
  engine: DEngineClient;
  vault: DVault;
  fname: string;
  dest: DendronASTDest;
} & { config?: DendronConfig; wsRoot?: string };

/**
 * Data from the processor
 */
export type ProcDataFullV5 = {
  engine: DEngineClient;
  vault: DVault;
  fname: string;
  wsRoot: string;
  config: DendronConfig;
  dest: DendronASTDest;
  /**
   * Keep track of current note ref level
   */
  noteRefLvl: number;
};

function checkProps({
  requiredProps,
  data,
}: {
  requiredProps: string[];
  data: any;
}): { valid: true } | { valid: false; missing: string[] } {
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
    return { valid: false, missing };
  }
  return { valid: true };
}

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
      this.getProcOpts(proc).flavor === ProcFlavor.PUBLISHING
    );
  }

  /**
   * Used for processing a Dendron markdown note
   */
  static _procRemark(opts: ProcOptsV5, data: Partial<ProcDataFullOptsV5>) {
    const errors: DendronError[] = [];
    opts = _.defaults(opts, { flavor: ProcFlavor.REGULAR });
    let proc = remark()
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
    switch (opts.mode) {
      case ProcMode.FULL:
        {
          if (_.isUndefined(data)) {
            throw DendronError.createFromStatus({
              status: ERROR_STATUS.INVALID_CONFIG,
              message: `data is required when not using raw proc`,
            });
          }
          const requiredProps = ["vault", "engine", "fname", "dest"];
          const resp = checkProps({ requiredProps, data });
          if (!resp.valid) {
            throw DendronError.createFromStatus({
              status: ERROR_STATUS.INVALID_CONFIG,
              message: `missing required fields in data. ${resp.missing.join(
                " ,"
              )} missing`,
            });
          }
          if (!data.config) {
            data.config = data.engine!.config;
          }
          if (!data.wsRoot) {
            data.wsRoot = data.engine!.wsRoot;
          }

          // backwards compatibility, default to v4 values
          data = _.defaults(MDUtilsV4.getDendronData(proc), data);
          this.setProcData(proc, data as ProcDataFullV5);
          MDUtilsV4.setEngine(proc, data.engine!);

          // add additional plugins
          proc = proc.use(dendronPub, {
            insertTitle: data.config?.useFMTitle,
          });
          if (data.config?.useKatex) {
            proc = proc.use(math);
          }
          if (data.config?.mermaid) {
            proc = proc.use(mermaid, { simple: true });
          }
          // add flavor specific plugins
          if (opts.flavor === ProcFlavor.PREVIEW) {
            proc = proc.use(dendronPreview);
          }
        }
        break;
      case ProcMode.IMPORT: {
        const requiredProps = ["vault", "engine", "dest"];
        const resp = checkProps({ requiredProps, data });
        if (!resp.valid) {
          throw DendronError.createFromStatus({
            status: ERROR_STATUS.INVALID_CONFIG,
            message: `missing required fields in data. ${resp.missing.join(
              " ,"
            )} missing`,
          });
        }
        if (!data.config) {
          data.config = data.engine!.config;
        }
        if (!data.wsRoot) {
          data.wsRoot = data.engine!.wsRoot;
        }

        // backwards compatibility, default to v4 values
        data = _.defaults(MDUtilsV4.getDendronData(proc), data);
        this.setProcData(proc, data as ProcDataFullV5);
        MDUtilsV4.setEngine(proc, data.engine!);

        // add additional plugins
        if (data.config?.useKatex) {
          proc = proc.use(math);
        }
        if (data.config?.mermaid) {
          proc = proc.use(mermaid, { simple: true });
        }
        break;
      }
      case ProcMode.NO_DATA:
        break;
      default:
        assertUnreachable();
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
    if (this.shouldApplyPublishingRules(pRehype)) {
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

  static procRemarkFull(data: ProcDataFullOptsV5, opts?: { mode?: ProcMode }) {
    return this._procRemark(
      { mode: opts?.mode || ProcMode.FULL, flavor: ProcFlavor.REGULAR },
      data
    );
  }

  /**
   * Parse Dendron Markdown Note. No compiler is attached.
   * @param opts
   * @param data
   * @returns
   */
  static procRemarkParse(opts: ProcOptsV5, data: Partial<ProcDataFullOptsV5>) {
    return this._procRemark({ ...opts, parseOnly: true }, data);
  }

  /**
   * Equivalent to running {@link procRemarkParse({mode: ProcMode.NO_DATA})}
   */
  static procRemarkParseNoData(
    opts: Omit<ProcOptsV5, "mode" | "parseOnly">,
    data: Partial<ProcDataFullOptsV5> & { dest: DendronASTDest }
  ) {
    return this._procRemark(
      { ...opts, parseOnly: true, mode: ProcMode.NO_DATA },
      data
    );
  }

  /**
   * Equivalent to running {@link procRemarkParse({mode: ProcMode.FULL})}
   */
  static procRemarkParseFull(
    opts: Omit<ProcOptsV5, "mode" | "parseOnly">,
    data: ProcDataFullOptsV5
  ) {
    return this._procRemark(
      { ...opts, parseOnly: true, mode: ProcMode.FULL },
      data
    );
  }

  static procRehypeParse(opts: ProcOptsV5, data?: Partial<ProcDataFullOptsV5>) {
    return this._procRemark(
      { ...opts, parseOnly: true },
      { ...data, dest: DendronASTDest.HTML }
    );
  }

  static procRehypeFull(
    data: Omit<ProcDataFullOptsV5, "dest">,
    opts?: { flavor?: ProcFlavor }
  ) {
    const proc = this._procRehype(
      { mode: ProcMode.FULL, parseOnly: false, flavor: opts?.flavor },
      data
    );
    return proc.use(rehypeStringify);
  }
}
