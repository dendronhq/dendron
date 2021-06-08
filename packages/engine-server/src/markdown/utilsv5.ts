import {
  DendronConfig,
  DendronError,
  DEngineClient,
  DVault,
  ERROR_STATUS,
} from "@dendronhq/common-all";
import remark from "remark";
import remarkParse from "remark-parse";
import frontmatterPlugin from "remark-frontmatter";
import abbrPlugin from "remark-abbr";
import { wikiLinks } from "./remark/wikiLinks";
import { Processor } from "unified";
import { blockAnchors } from "./remark/blockAnchors";
import { noteRefsV2 } from "./remark/noteRefsV2";
import _ from "lodash";
import { MDUtilsV4 } from "./utils";
import { DendronASTDest } from "./types";

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
  mode: ProcMode;
  /**
   * Don't attach compiler
   */
  parseOnly?: boolean;
};

/**
 * Data to pass in to a processor
 */
export type ProcDataFullV5 = {
  engine: DEngineClient;
  vault: DVault;
  fname: string;
  config: DendronConfig;
  dest: DendronASTDest;
};

export type ProcDataFullOptsV5 = {
  engine: DEngineClient;
  vault: DVault;
  fname: string;
  dest: DendronASTDest;
} & { config?: DendronConfig };

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
    return _data || {};
  }

  static setProcData(proc: Processor, opts: ProcDataFullV5) {
    const _data = proc.data("dendronProcDatav5") as ProcDataFullV5;
    return proc.data("dendronProcDatav5", { ..._data, ...opts });
  }

  static isV5Active(proc: Processor) {
    return !_.isUndefined(this.getProcOpts(proc));
  }

  /**
   * Used for processing a Dendron markdown note
   */
  static _procRemark(opts: ProcOptsV5, data?: Partial<ProcDataFullOptsV5>) {
    const errors: DendronError[] = [];
    let proc = remark()
      .use(remarkParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"])
      .use(abbrPlugin)
      .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } })
      .use(noteRefsV2)
      .use(wikiLinks)
      .use(blockAnchors)
      .data("errors", errors);
    proc = this.setProcOpts(proc, opts);
    if (opts.mode === ProcMode.FULL) {
      if (_.isUndefined(data)) {
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_CONFIG,
          message: `data is required when not using raw proc`,
        });
      }
      const hasAllProps = _.map(
        ["vault", "engine", "fname", "dest"],
        (prop) => {
          // @ts-ignore
          return !_.isUndefined(data[prop]);
        }
      );
      if (!_.every(hasAllProps)) {
        throw DendronError.createFromStatus({
          status: ERROR_STATUS.INVALID_CONFIG,
          message: `missing required fields in data`,
        });
      }
      if (!data.config) {
        data.config = data.engine!.config;
      }

      // backwards compatibility, default to v4 values
      data = _.defaults(MDUtilsV4.getDendronData(proc), data);
      this.setProcData(proc, data as ProcDataFullV5);
      MDUtilsV4.setDendronData(proc, data);
      MDUtilsV4.setEngine(proc, data.engine!);
    }
    return proc;
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
  static procRemarkParse(opts: ProcOptsV5, data?: Partial<ProcDataFullOptsV5>) {
    return this._procRemark({ ...opts, parseOnly: true }, data);
  }
}
