import {
  assertUnreachable,
  DendronError,
  ERROR_STATUS,
  ProcFlavor,
} from "@dendronhq/common-all";
// @ts-ignore
import rehypePrism from "@mapbox/rehype-prism";
// @ts-ignore
import mermaid from "@dendronhq/remark-mermaid";
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
import { hierarchies } from "./remark";
import { backlinks } from "./remark/backlinks";
import { backlinksHover } from "./remark/backlinksHover";
import { blockAnchors } from "./remark/blockAnchors";
import { dendronHoverPreview } from "./remark/dendronPreview";
import { dendronPub } from "./remark/dendronPub";
import { extendedImage } from "./remark/extendedImage";
import { hashtags } from "./remark/hashtag";
// import { noteRefsV2 } from "./remark/noteRefsV2";
import { userTags } from "./remark/userTags";
import { wikiLinks } from "./remark/wikiLinks";
import { DendronASTDest } from "./types";
import { MDUtilsV5, ProcDataFullOptsV5, ProcMode, ProcOptsV5 } from "./utilsv5";
import { Processor } from "unified";

/**
 * Special version of MDUtilsV5 to get preview working in the web extension.
 * This class should eventually be deleted and converged with utilsV5 once
 * utilsV5 is compatible with EngineV3.
 */
export class MDUtilsV5Web {
  public static procRehypeWeb(
    data: Omit<ProcDataFullOptsV5, "dest">,
    opts?: { flavor?: ProcFlavor }
  ): Processor<remark.PartialRemarkOptions> {
    const proc = this._procRehype(
      { mode: ProcMode.FULL, parseOnly: false, flavor: opts?.flavor },
      data
    );
    return proc.use(rehypeStringify);
  }

  /**
   * Used for processing a Dendron markdown note
   */
  private static _procRemarkWeb(
    opts: ProcOptsV5,
    data: Partial<ProcDataFullOptsV5>
  ) {
    const errors: DendronError[] = [];
    opts = _.defaults(opts, { flavor: ProcFlavor.REGULAR });
    let proc = remark()
      .use(remarkParse, { gfm: true })
      .use(frontmatterPlugin, ["yaml"])
      .use(abbrPlugin)
      .use({ settings: { listItemIndent: "1", fences: true, bullet: "-" } })
      // .use(noteRefsV2) TODO: Add in note ref functionalit
      .use(blockAnchors)
      .use(hashtags)
      .use(userTags)
      .use(extendedImage)
      .use(footnotes)
      .use(variables)
      .use(backlinksHover, data.backlinkHoverOpts)
      .use(wikiLinks)
      .data("errors", errors);

    // set options and do validation
    proc = MDUtilsV5.setProcOpts(proc, opts);

    switch (opts.mode) {
      case ProcMode.FULL:
        {
          if (_.isUndefined(data)) {
            throw DendronError.createFromStatus({
              status: ERROR_STATUS.INVALID_CONFIG,
              message: `data is required when not using raw proc`,
            });
          }

          const note = data.noteToRender;

          if (!_.isUndefined(note)) {
            proc = proc.data("fm", MDUtilsV5.getFM({ note }));
          }

          MDUtilsV5.setProcData(proc, data);

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

          proc = proc.use(math);
          proc = proc.use(mermaid, { simple: true });

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
      case ProcMode.IMPORT:
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
        behavior: "append",
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
  ) {
    return this._procRemarkWeb({ ...opts, parseOnly: true }, data);
  }
}
