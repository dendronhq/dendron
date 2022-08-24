import {
  assertUnreachable,
  DendronError,
  DendronPublishingConfig,
  DVault,
  ERROR_STATUS,
  IntermediateDendronConfig,
  NoteProps,
  NotePropsByIdDict,
  ProcFlavor,
} from "@dendronhq/common-all";
// @ts-ignore
import rehypePrism from "@mapbox/rehype-prism";
// @ts-ignore
// import mermaid from "@dendronhq/remark-mermaid";
import _ from "lodash";
import link from "rehype-autolink-headings";
import math from "remark-math";
// @ts-ignore
import variables from "remark-variables";
// @ts-ignore
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
import { hierarchies } from "./remark";
import { backlinks } from "./remark/backlinks";
import { BacklinkOpts, backlinksHover } from "./remark/backlinksHover";
import { blockAnchors } from "./remark/blockAnchors";
import { dendronHoverPreview } from "./remark/dendronPreview";
import { dendronPub, DendronPubOpts } from "./remark/dendronPub";
import { extendedImage } from "./remark/extendedImage";
import { hashtags } from "./remark/hashtag";
// import { noteRefsV2 } from "./remark/noteRefsV2";
import { URI } from "vscode-uri";
import { userTags } from "./remark/userTags";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";
import { DendronASTDest } from "./types";
import {
  MDUtilsV5,
  ProcDataFullOptsV5,
  ProcDataFullV5,
  ProcMode,
  ProcOptsV5,
} from "./utilsv5";

// export type ProcDataFullWebV5 = {
//   // engine: ReducedDEngine;
//   noteToRender: NoteProps;
//   vault: DVault;
//   fname: string;
//   dest: DendronASTDest;
//   /**
//    * Supply alternative dictionary of notes to use when resolving note ids
//    */
//   notes?: NotePropsByIdDict;
//   /**
//    * Check to see if we are in a note reference.
//    */
//   insideNoteRef?: boolean;
//   /**
//    * frontmatter variables exposed for substitution
//    */
//   fm?: any;
//   wikiLinksOpts?: WikiLinksOpts;
//   publishOpts?: DendronPubOpts;
//   backlinkHoverOpts?: BacklinkOpts;

//   // TODO: Can we use this instead:
//   // publishingConfig: DendronPublishingConfig;

//   config: IntermediateDendronConfig;
//   // config?: IntermediateDendronConfig;
//   wsRoot?: URI;
// };

// /**
//  * Data from the processor
//  */
// export type ProcDataFullV5 = {
//   // main properties that are configured when processor is created
//   engine: DEngineClient;
//   vault: DVault;
//   fname: string;
//   dest: DendronASTDest;
//   wsRoot: string;

//   // derived: unless passed in, these come from engine or are set by
//   // other unified plugins
//   config: IntermediateDendronConfig;
//   notes?: NotePropsByIdDict;
//   insideNoteRef?: boolean;

//   fm?: any;
//   /**
//    * Keep track of current note ref level
//    */
//   noteRefLvl: number;
// };

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

export class MDUtilsV5Web {
  private static setProcData(
    proc: Processor,
    opts: Partial<ProcDataFullV5>
    // opts: Partial<ProcDataFullWebV5>
  ) {
    const _data = proc.data("dendronProcDatav5") as ProcDataFullV5;
    // const _data = proc.data("dendronProcDatav5") as ProcDataFullWebV5;
    // const notes = _.isUndefined(opts.notes) ? opts?.engine?.notes : opts.notes;
    return proc.data("dendronProcDatav5", { ..._data, ...opts });
  }

  private static setProcOpts(proc: Processor, opts: ProcOptsV5) {
    const _data = proc.data("dendronProcOptsv5") as ProcOptsV5;
    return proc.data("dendronProcOptsv5", { ..._data, ...opts });
  }

  private static getFM(opts: { note: NoteProps }) {
    const { note } = opts;
    const custom = note.custom ? note.custom : undefined;
    return {
      ...custom,
      id: note.id,
      title: note.title,
      desc: note.desc,
      created: note.created,
      updated: note.updated,
    };
  }

  /**
   * Used for processing a Dendron markdown note
   */
  private static _procRemarkWeb(
    opts: ProcOptsV5,
    data: Partial<ProcDataFullOptsV5>
    // data: Partial<ProcDataFullWebV5>
  ) {
    const errors: DendronError[] = [];
    opts = _.defaults(opts, { flavor: ProcFlavor.REGULAR });
    let proc = remark()
      .use(remarkParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"])
      .use(abbrPlugin)
      .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } })
      // .use(noteRefsV2) Don't do note refs for now.
      .use(blockAnchors)
      .use(hashtags)
      .use(userTags)
      .use(extendedImage)
      .use(footnotes)
      .use(variables)
      .use(backlinksHover, data.backlinkHoverOpts)
      .data("errors", errors);

    //do not convert wikilinks if convertLinks set to false. Used by gdoc export pod. It uses HTMLPublish pod to do the md-->html conversion
    if (
      _.isUndefined(data.wikiLinksOpts?.convertLinks) ||
      data.wikiLinksOpts?.convertLinks
    ) {
      proc = proc.use(wikiLinks, data.wikiLinksOpts);
    }

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
          // const requiredProps = ["vault", "engine", "fname", "dest"];
          // const resp = checkProps({ requiredProps, data });
          // if (!resp.valid) {
          //   throw DendronError.createFromStatus({
          //     status: ERROR_STATUS.INVALID_CONFIG,
          //     message: `missing required fields in data. ${resp.missing.join(
          //       " ,"
          //     )} missing`,
          //   });
          // }

          // TODO: Not sure if we need to re-enable these overrides:
          // if (!data.config) {
          //   data.config = data.engine!.config;
          // }
          // if (!data.wsRoot) {
          //   data.wsRoot = data.engine!.wsRoot;
          // }

          // TODO: Need NoteProps here instead.
          // const debugger; note = NoteUtils.getNoteByFnameFromEngine({
          //   fname: data.fname!,
          //   engine: data.engine!,
          //   vault: data.vault!,
          // });

          const note = data.noteToRender;

          if (!_.isUndefined(note)) {
            proc = proc.data("fm", this.getFM({ note }));
          }

          this.setProcData(proc, data);

          // NOTE: order matters. this needs to appear before `dendronPub`
          if (data.dest === DendronASTDest.HTML) {
            //do not convert backlinks, children if convertLinks set to false. Used by gdoc export pod. It uses HTMLPublish pod to do the md-->html conversion
            if (
              _.isUndefined(data.wikiLinksOpts?.convertLinks) ||
              data.wikiLinksOpts?.convertLinks
            ) {
              proc = proc.use(hierarchies).use(backlinks);
            }
          }
          // Add flavor specific plugins. These need to come before `dendronPub`
          // to fix extended image URLs before they get converted to HTML
          if (opts.flavor === ProcFlavor.PREVIEW) {
            // No extra plugins needed for the preview right now. We used to
            // need a plugin to rewrite URLs to get the engine to proxy images,
            // but now that's done by the
            // [[PreviewPanel|../packages/plugin-core/src/components/views/PreviewPanel.ts#^preview-rewrites-images]]
          }
          if (
            opts.flavor === ProcFlavor.HOVER_PREVIEW ||
            opts.flavor === ProcFlavor.BACKLINKS_PANEL_HOVER
          ) {
            proc = proc.use(dendronHoverPreview);
          }
          // add additional plugins
          // TODO: Add back note ref functionality:
          // const isNoteRef = !_.isUndefined(data.noteRefLvl);
          let insertTitle;
          // if (isNoteRef || opts.flavor === ProcFlavor.BACKLINKS_PANEL_HOVER) {
          //   insertTitle = false;
          // } else {
          // const config = data.config as IntermediateDendronConfig;
          // const shouldApplyPublishRules =
          //   MDUtilsV5.shouldApplyPublishingRules(proc);
          // insertTitle = ConfigUtils.getEnableFMTitle(
          //   config,
          //   shouldApplyPublishRules
          // );
          // }
          // const config = data.config as IntermediateDendronConfig;
          const publishingConfig = data.config?.publishing;
          const assetsPrefix = publishingConfig
            ? publishingConfig.assetsPrefix
            : "";

          proc = proc.use(dendronPub, {
            insertTitle,
            transformNoPublish: opts.flavor === ProcFlavor.PUBLISHING,
            ...data.publishOpts,
          });

          // const shouldApplyPublishRules =
          //   MDUtilsV5.shouldApplyPublishingRules(proc);

          // if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
          //   proc = proc.use(math);
          // }
          // if (ConfigUtils.getEnableMermaid(config, shouldApplyPublishRules)) {
          //   proc = proc.use(mermaid, { simple: true });
          // }
          // TODO: Re-enable config checks, for now, just use them:
          proc = proc.use(math);
          // proc = proc.use(mermaid, { simple: true });

          // Add remaining flavor specific plugins
          if (opts.flavor === ProcFlavor.PUBLISHING) {
            const prefix = assetsPrefix ? assetsPrefix + "/notes/" : "/notes/";
            proc = proc.use(dendronPub, {
              wikiLinkOpts: {
                prefix,
              },
            });
          }
        }
        break;
      case ProcMode.IMPORT: {
        // const requiredProps = ["vault", "engine", "dest"];
        // const resp = checkProps({ requiredProps, data });
        // if (!resp.valid) {
        //   throw DendronError.createFromStatus({
        //     status: ERROR_STATUS.INVALID_CONFIG,
        //     message: `missing required fields in data. ${resp.missing.join(
        //       " ,"
        //     )} missing`,
        //   });
        // }
        // if (!data.config) {
        //   data.config = data.engine!.config;
        // }
        // if (!data.wsRoot) {
        //   data.wsRoot = data.engine!.wsRoot;
        // }

        // // backwards compatibility, default to v4 values
        // this.setProcData(proc, data as ProcDataFullV5);

        // // add additional plugins
        // const config = data.config as IntermediateDendronConfig;
        // const shouldApplyPublishRules =
        //   MDUtilsV5.shouldApplyPublishingRules(proc);

        // if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
        //   proc = proc.use(math);
        // }

        // if (ConfigUtils.getEnableMermaid(config, shouldApplyPublishRules)) {
        //   proc = proc.use(mermaid, { simple: true });
        // }
        break;
      }
      case ProcMode.NO_DATA:
        break;
      default:
        assertUnreachable(opts.mode);
    }
    return proc;
  }

  private static _procRehype(
    opts: ProcOptsV5,
    data?: Partial<ProcDataFullOptsV5>
    // data?: Partial<ProcDataFullWebV5>
  ) {
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
    // const config = data?.engine?.config as IntermediateDendronConfig;
    const shouldApplyPublishRules =
      MDUtilsV5.shouldApplyPublishingRules(pRehype);

    // if (ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)) {
    //   pRehype = pRehype.use(katex);
    // }

    // apply publishing specific things
    if (shouldApplyPublishRules) {
      pRehype = pRehype.use(link, {
        properties: {
          "aria-hidden": "true",
          class: "anchor-heading icon-link",
        },
        content: {
          type: "text",
          // @ts-ignore
          value: "",
        },
      });
    }
    return pRehype;
  }

  /**
   * Parse Dendron Markdown Note. No compiler is attached.
   * @param opts
   * @param data
   * @returns
   */
  private static procRemarkParse(
    opts: ProcOptsV5,
    data: Partial<ProcDataFullOptsV5>
    // data: Partial<ProcDataFullWebV5>
  ) {
    return this._procRemarkWeb({ ...opts, parseOnly: true }, data);
  }

  public static procRehypeWeb(
    data: Omit<ProcDataFullOptsV5, "dest">,
    // data: Omit<ProcDataFullWebV5, "dest">,
    opts?: { flavor?: ProcFlavor }
  ) {
    const proc = this._procRehype(
      { mode: ProcMode.FULL, parseOnly: false, flavor: opts?.flavor },
      data
    );
    return proc.use(rehypeStringify);
  }
}
