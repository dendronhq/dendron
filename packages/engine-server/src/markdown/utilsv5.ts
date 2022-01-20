import {
  assertUnreachable,
  IntermediateDendronConfig,
  DendronError,
  DEngineClient,
  DVault,
  ERROR_STATUS,
  NotePropsDict,
  NoteUtils,
  NoteProps,
  DateTime,
  ConfigUtils,
  ProcFlavor,
} from "@dendronhq/common-all";
// @ts-ignore
import rehypePrism from "@mapbox/rehype-prism";
// @ts-ignore
import mermaid from "@dendronhq/remark-mermaid";
import _ from "lodash";
import math from "remark-math";
import link from "rehype-autolink-headings";
// @ts-ignore
import variables from "remark-variables";
// @ts-ignore
import katex from "rehype-katex";
import raw from "rehype-raw";
import slug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remark from "remark";
import abbrPlugin from "remark-abbr";
import footnotes from "remark-footnotes";
import frontmatterPlugin from "remark-frontmatter";
import remarkParse from "remark-parse";
import remark2rehype from "remark-rehype";
import { Processor } from "unified";
import { blockAnchors } from "./remark/blockAnchors";
import { dendronPreview, dendronHoverPreview } from "./remark/dendronPreview";
import { dendronPub, DendronPubOpts } from "./remark/dendronPub";
import { noteRefsV2 } from "./remark/noteRefsV2";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";
import { DendronASTDest } from "./types";
import { MDUtilsV4 } from "./utils";
import { hashtags } from "./remark/hashtag";
import { userTags } from "./remark/userTags";
import { backlinks } from "./remark/backlinks";
import { hierarchies } from "./remark";
import { extendedImage } from "./remark/extendedImage";
import { WorkspaceService } from "../workspace";
import { DateTimeFormatOptions } from "luxon";

export { ProcFlavor };

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
   * Running processor in import mode. Notes don't exist. Used for import pods like {@link MarkdownPod}
   * where notes don't exist in the engine prior to import.
   */
  IMPORT = "IMPORT",
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
  /**
   * Supply alternative dictionary of notes to use when resolving note ids
   */
  notes?: NotePropsDict;
  /**
   * Check to see if we are in a note reference.
   */
  insideNoteRef?: boolean;
  /**
   * frontmatter variables exposed for substitution
   */
  fm?: any;
  wikiLinksOpts?: WikiLinksOpts;
  publishOpts?: DendronPubOpts;
} & {
  config?: IntermediateDendronConfig;
  wsRoot?: string;
};

/**
 * Data from the processor
 */
export type ProcDataFullV5 = {
  // main properties that are configured when processor is created
  engine: DEngineClient;
  vault: DVault;
  fname: string;
  dest: DendronASTDest;
  wsRoot: string;

  // derived: unless passed in, these come from engine or are set by
  // other unified plugins
  config: IntermediateDendronConfig;
  notes?: NotePropsDict;
  insideNoteRef?: boolean;

  fm?: any;
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

  static getNoteByFname(proc: Processor, { fname }: { fname: string }) {
    const { notes, vault, wsRoot } = this.getProcData(proc);
    // TODO: this is for backwards compatibility
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    const note = NoteUtils.getNoteByFnameV5({
      fname,
      notes: notes || engine.notes,
      vault,
      wsRoot,
    });
    return note;
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

  static setNoteRefLvl(proc: Processor, lvl: number) {
    // backwards compatibility
    MDUtilsV4.setNoteRefLvl(proc, lvl);
    return this.setProcData(proc, { noteRefLvl: lvl });
  }

  static setProcData(proc: Processor, opts: Partial<ProcDataFullV5>) {
    const _data = proc.data("dendronProcDatav5") as ProcDataFullV5;
    // TODO: for backwards compatibility
    MDUtilsV4.setProcOpts(proc, opts);
    MDUtilsV4.setDendronData(proc, opts);
    const notes = _.isUndefined(opts.notes) ? opts?.engine?.notes : opts.notes;
    return proc.data("dendronProcDatav5", { ..._data, ...opts, notes });
  }

  static setProcOpts(proc: Processor, opts: ProcOptsV5) {
    const _data = proc.data("dendronProcOptsv5") as ProcOptsV5;
    return proc.data("dendronProcOptsv5", { ..._data, ...opts });
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

  static getFM(opts: { note: NoteProps; wsRoot: string }) {
    const { note, wsRoot } = opts;

    const custom = note.custom ? note.custom : undefined;

    const ws = new WorkspaceService({ wsRoot });
    const wsConfig = ws.getWorkspaceConfig();
    ws.dispose();
    const timestampConfig: keyof typeof DateTime =
      wsConfig?.settings["dendron.defaultTimestampDecorationFormat"];
    const formatOption = DateTime[timestampConfig] as
      | DateTimeFormatOptions
      | undefined;
    const created = DateTime.fromMillis(_.toInteger(note.created));
    const updated = DateTime.fromMillis(_.toInteger(note.updated));

    return {
      ...custom,
      id: note.id,
      title: note.title,
      desc: note.desc,
      created: created.toLocaleString(formatOption),
      updated: updated.toLocaleString(formatOption),
    };
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
      .use(wikiLinks, data.wikiLinksOpts)
      .use(blockAnchors)
      .use(hashtags)
      .use(userTags)
      .use(extendedImage)
      .use(footnotes)
      .use(variables)
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

          const note = NoteUtils.getNoteByFnameV5({
            fname: data.fname!,
            notes: data.engine!.notes,
            vault: data.vault!,
            wsRoot: data.wsRoot,
          }) as NoteProps;

          if (!_.isUndefined(note)) {
            proc = proc.data("fm", this.getFM({ note, wsRoot: data.wsRoot }));
          }

          // backwards compatibility, default to v4 values
          data = _.defaults(MDUtilsV4.getDendronData(proc), data);
          this.setProcData(proc, data as ProcDataFullV5);
          MDUtilsV4.setEngine(proc, data.engine!);

          // NOTE: order matters. this needs to appear before `dendronPub`
          if (data.dest === DendronASTDest.HTML) {
            proc = proc.use(hierarchies).use(backlinks);
          }
          // Add flavor specific plugins. These need to come before `dendronPub`
          // to fix extended image URLs before they get converted to HTML
          if (opts.flavor === ProcFlavor.PREVIEW) {
            proc = proc.use(dendronPreview);
          }
          if (opts.flavor === ProcFlavor.HOVER_PREVIEW) {
            proc = proc.use(dendronHoverPreview);
          }
          // add additional plugins
          const isNoteRef = !_.isUndefined((data as ProcDataFullV5).noteRefLvl);
          let insertTitle;
          if (isNoteRef) {
            insertTitle = false;
          } else {
            const config = data.config as IntermediateDendronConfig;
            const shouldApplyPublishRules =
              MDUtilsV5.shouldApplyPublishingRules(proc);
            insertTitle = ConfigUtils.getEnableFMTitle(
              config,
              shouldApplyPublishRules
            );
          }
          const config = data.config as IntermediateDendronConfig;
          const publishingConfig = ConfigUtils.getPublishingConfig(config);
          const assetsPrefix = publishingConfig.assetsPrefix;

          proc = proc.use(dendronPub, {
            insertTitle,
            transformNoPublish: opts.flavor === ProcFlavor.PUBLISHING,
            ...data.publishOpts,
          });

          const shouldApplyPublishRules =
            MDUtilsV5.shouldApplyPublishingRules(proc);

          if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
            proc = proc.use(math);
          }

          if (ConfigUtils.getEnableMermaid(config, shouldApplyPublishRules)) {
            proc = proc.use(mermaid, { simple: true });
          }
          // Add remaining flavor specific plugins
          if (opts.flavor === ProcFlavor.PUBLISHING) {
            const prefix = data.config?.site.assetsPrefix
              ? data.config?.site.assetsPrefix + "/notes/"
              : "/notes/";
            proc = proc.use(dendronPub, {
              wikiLinkOpts: {
                prefix,
              },
            });
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
        const config = data.config as IntermediateDendronConfig;
        const shouldApplyPublishRules =
          MDUtilsV5.shouldApplyPublishingRules(proc);

        if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
          proc = proc.use(math);
        }

        if (ConfigUtils.getEnableMermaid(config, shouldApplyPublishRules)) {
          proc = proc.use(mermaid, { simple: true });
        }
        break;
      }
      case ProcMode.NO_DATA:
        break;
      default:
        assertUnreachable(opts.mode);
    }
    return proc;
  }

  static _procRehype(opts: ProcOptsV5, data?: Partial<ProcDataFullOptsV5>) {
    const pRemarkParse = this.procRemarkParse(opts, {
      ...data,
      dest: DendronASTDest.HTML,
    });

    // add additional plugin for publishing

    let pRehype = pRemarkParse
      .use(remark2rehype, { allowDangerousHtml: true })
      .use(rehypePrism, { ignoreMissing: true })
      .use(raw)
      .use(slug);

    // apply plugins enabled by config
    const config = data?.config as IntermediateDendronConfig;
    const enableKatex = MDUtilsV5.shouldApplyPublishingRules(pRehype)
      ? ConfigUtils.getProp(config, "useKatex")
      : ConfigUtils.getPreview(config).enableKatex;

    if (enableKatex) {
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
          // @ts-ignore
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

  static procRemarkFull(
    data: ProcDataFullOptsV5,
    opts?: { mode?: ProcMode; flavor?: ProcFlavor }
  ) {
    return this._procRemark(
      {
        mode: opts?.mode || ProcMode.FULL,
        flavor: opts?.flavor || ProcFlavor.REGULAR,
      },
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
   *
   * Warning! When using a no-data parser, any user configuration will not be
   * available. Avoid using it unless you are sure that the user configuration
   * has no effect on what you are doing.
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
