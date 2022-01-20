import {
  IntermediateDendronConfig,
  DendronError,
  DEngineClient,
  DNoteLoc,
  DVault,
  GetNoteOpts,
  getSlugger,
  getStage,
  NotePropsDict,
  NoteProps,
  NoteUtils,
  VaultUtils,
  ConfigUtils,
  FIFOQueue,
} from "@dendronhq/common-all";
// @ts-ignore
import mermaid from "@dendronhq/remark-mermaid";
// @ts-ignore
import rehypePrism from "@mapbox/rehype-prism";
import _ from "lodash";
import { Heading } from "mdast";
import { blockquote, paragraph, root, text } from "mdast-builder";
import path from "path";
import link from "rehype-autolink-headings";
// @ts-ignore
import katex from "rehype-katex";
import raw from "rehype-raw";
import slug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remark from "remark";
import abbrPlugin from "remark-abbr";
// @ts-ignore
import containers from "remark-containers";
import footnotes from "remark-footnotes";
import frontmatterPlugin from "remark-frontmatter";
import math from "remark-math";
import remarkParse from "remark-parse";
import remark2rehype from "remark-rehype";
import remarkStringify from "remark-stringify";
// @ts-ignore
import variables from "remark-variables";
// eslint-disable-next-line import/no-named-default
import { default as unified, default as Unified, Processor } from "unified";
import { Node, Parent } from "unist";
import { hierarchies, RemarkUtils } from "./remark";
import { backlinks } from "./remark/backlinks";
import { dendronPub, DendronPubOpts } from "./remark/dendronPub";
import { NoteRefsOptsV2, noteRefsV2 } from "./remark/noteRefsV2";
import { publishSite } from "./remark/publishSite";
import { transformLinks } from "./remark/transformLinks";
import { wikiLinks, WikiLinksOpts } from "./remark/wikiLinks";
import { BlockAnchorOpts, blockAnchors } from "./remark/blockAnchors";
import {
  DendronASTData,
  DendronASTDest,
  VaultMissingBehavior,
  DendronASTTypes,
} from "./types";
import { hashtags } from "./remark/hashtag";
import { userTags } from "./remark/userTags";
import { extendedImage } from "./remark/extendedImage";

const toString = require("mdast-util-to-string");

type ProcOpts = {
  engine: DEngineClient;
};

type ProcParseOpts = {
  dest: DendronASTDest;
  fname: string;
} & ProcOpts;

type ProcOptsFull = ProcOpts & {
  dest: DendronASTDest;
  shouldApplyPublishRules?: boolean;
  vault: DVault;
  fname: string;
  config?: IntermediateDendronConfig;
  mathOpts?: {
    katex?: boolean;
  };
  mermaid?: boolean;
  noteRefLvl?: number;
  usePrettyRefs?: boolean;
  // shouldn't need to be used
  wikiLinksOpts?: WikiLinksOpts;
  publishOpts?: DendronPubOpts;
  blockAnchorsOpts?: BlockAnchorOpts;
  noteRefOpts?: NoteRefsOptsV2;
};

type ProcDendron = ProcOpts & {
  dest: DendronASTDest;
  vault: DVault;
  fname: string;
  configOverride?: IntermediateDendronConfig;
};

enum DendronProcDataKeys {
  PROC_OPTS = "procOpts",
  NOTE_REF_LVL = "noteRefLvl",
  ENGINE = "engine",
}

export const renderFromNoteProps = (
  opts: { notes: NotePropsDict } & GetNoteOpts
) => {
  const note = NoteUtils.getNoteByFnameV5(opts);
  if (!note) {
    throw Error("no note found");
  }
  return renderFromNote({ note });
};

export const renderFromNote = (opts: { note: NoteProps }) => {
  const { note } = opts;
  const contents = note.body;
  return contents;
};

export type ParentWithIndex = {
  ancestor: Parent;
  index: number;
};

type VisitorParentsIndices = ({
  node,
  index,
  ancestors,
}: {
  node: Node;
  index: number;
  ancestors: ParentWithIndex[];
}) => boolean | undefined | "skip";

/** @deprecated Please use {@link MDUtilsV5} instead. */
export class MDUtilsV4 {
  static getDendronData(proc: Processor) {
    return proc.data("dendron") as DendronASTData;
  }

  /**
   * Get the vault name, either from processor or passed in vaultName
   * @param opts.vaultMissingBehavior how to respond if no vault is found. See {@link VaultMissingBehavior}
   */
  static getVault(
    proc: Processor,
    vaultName?: string,
    opts?: { vaultMissingBehavior?: VaultMissingBehavior }
  ) {
    const copts = _.defaults(opts || {}, {
      vaultMissingBehavior: VaultMissingBehavior.THROW_ERROR,
    });
    let { vault } = MDUtilsV4.getDendronData(proc);
    const { engine } = MDUtilsV4.getEngineFromProc(proc);
    if (vaultName) {
      try {
        vault = VaultUtils.getVaultByNameOrThrow({
          vaults: engine.vaults,
          vname: vaultName,
        });
      } catch (err) {
        if (copts.vaultMissingBehavior === VaultMissingBehavior.THROW_ERROR) {
          throw err;
        }
      }
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
    const engine = proc.data("engine") as DEngineClient;
    let error: DendronError | undefined;
    if (_.isUndefined(engine) || _.isNull(engine)) {
      error = new DendronError({ message: "engine not defined" });
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

  static setEngine(proc: Unified.Processor, engine: DEngineClient) {
    proc.data(DendronProcDataKeys.ENGINE, engine);
  }

  static setNoteRefLvl(proc: Unified.Processor, lvl: number) {
    this.setProcOpts(proc, { noteRefLvl: lvl });
  }

  static setProcOpts(proc: Unified.Processor, data: Partial<ProcOptsFull>) {
    const procOpts = proc.data(DendronProcDataKeys.PROC_OPTS) as ProcOptsFull;
    return proc.data(DendronProcDataKeys.PROC_OPTS, { ...procOpts, ...data });
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
      .use(frontmatterPlugin, ["yaml"])
      .use(wikiLinks)
      .use(blockAnchors)
      .use(hashtags)
      .use(userTags)
      .use(extendedImage)
      .data("errors", errors);
    this.setDendronData(_proc, { dest: opts.dest, fname: opts.fname });
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
    let note: NoteProps | undefined;
    if (vault && fname) {
      const engine = MDUtilsV4.getEngineFromProc(proc).engine;
      note = NoteUtils.getNoteByFnameFromEngine({
        fname,
        vault,
        engine,
      });
      const fm = {
        ...note?.custom,
        title: note?.title,
      };
      proc = proc.data("fm", fm);
    }

    let usePrettyRefs = opts.usePrettyRefs;
    if (_.isUndefined(usePrettyRefs)) {
      usePrettyRefs = ConfigUtils.getEnablePrettyRefs(config, {
        shouldApplyPublishRules,
        note,
      });
    }

    const insertTitle = ConfigUtils.getEnableFMTitle(
      config,
      shouldApplyPublishRules
    );

    proc = proc
      .data("dendron", {
        dest,
        vault,
        fname,
        config,
        shouldApplyPublishRules,
      } as DendronASTData)
      .use(abbrPlugin)
      .use(variables)
      .use(footnotes)
      .use(hierarchies, {
        hierarchyDisplayTitle: config.hierarchyDisplayTitle,
        hierarchyDisplay: config.hierarchyDisplay,
      })
      .use(blockAnchors, _.merge(opts.blockAnchorsOpts))
      .use(hashtags)
      .use(userTags)
      .use(extendedImage)
      .use(noteRefsV2, {
        ...opts.noteRefOpts,
        wikiLinkOpts: opts.wikiLinksOpts,
        prettyRefs: usePrettyRefs,
        insertTitle,
      });

    //do not convert wikilinks if set to true. Used by gdoc export pod. It uses HTMLPublish pod to do the md-->html conversion
    if (
      _.isUndefined(opts.wikiLinksOpts?.convertLinks) ||
      opts.wikiLinksOpts?.convertLinks
    ) {
      proc = proc.use(wikiLinks, opts.wikiLinksOpts).use(backlinks);
    }

    if (
      opts.mathOpts?.katex ||
      ConfigUtils.getEnableKatex(config, shouldApplyPublishRules)
    ) {
      proc = proc.use(math);
    }

    if (
      opts.mermaid ||
      ConfigUtils.getEnableMermaid(config, shouldApplyPublishRules)
    ) {
      proc = proc.use(mermaid, { simple: true });
    }
    // MD_DENDRON, convert back to itself, no need for transformations
    if (dest !== DendronASTDest.MD_DENDRON) {
      proc = proc.use(dendronPub, {
        insertTitle,
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
    useLinks?: boolean;
  }) {
    const { proc, mdPlugins, useLinks } = _.defaults(opts, {
      mdPlugins: [],
      useLinks: true,
    });
    let _proc = proc || unified().use(remarkParse, { gfm: true });
    mdPlugins.forEach((p) => {
      _proc = _proc.use(p);
    });
    _proc = _proc
      .use(remark2rehype, { allowDangerousHtml: true })
      .use(rehypePrism, { ignoreMissing: true })
      .use(raw)
      .use(slug);
    if (useLinks) {
      _proc = _proc.use(link, {
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

  static procHTML(
    procOpts: Omit<ProcOptsFull, "dest"> & {
      noteIndex: NoteProps;
      useLinks?: boolean;
    }
  ) {
    const { engine, vault, fname, noteIndex } = procOpts;
    const config = procOpts.config || engine.config;

    // siteNotesDir is deprecated in new publishing namespace
    // and procHTML is not used anywhere other than 11ty and old tests.
    // TODO: deprecate old procs
    const siteNotesDir = config.site!.siteNotesDir;
    const absUrl = PublishUtils.getAbsUrlForAsset({ config });
    const linkPrefix = absUrl + "/" + siteNotesDir + "/";
    const wikiLinksOpts = { useId: true, prefix: linkPrefix };
    const publishingConfig = ConfigUtils.getPublishingConfig(config);
    let proc = MDUtilsV4.procFull({
      engine,
      dest: DendronASTDest.HTML,
      vault,
      fname,
      wikiLinksOpts,
      shouldApplyPublishRules: true,
      noteRefOpts: { wikiLinkOpts: wikiLinksOpts, prettyRefs: true },
      publishOpts: {
        assetsPrefix:
          getStage() === "prod" ? publishingConfig.assetsPrefix : undefined,
        insertTitle: ConfigUtils.getProp(config, "useFMTitle"),
        transformNoPublish: true,
      },
      mathOpts: { katex: true },
      mermaid: ConfigUtils.getProp(config, "mermaid"),
      config,
    });
    proc = proc.use(publishSite, { noteIndex });
    const enableContainers = ConfigUtils.getEnableContainers(config);
    if (enableContainers) {
      proc = proc.use(containers);
    }
    return MDUtilsV4.procRehype({
      proc,
      mathjax: true,
      useLinks: procOpts.useLinks,
    });
  }

  /**
   * Return a dendron processor
   * @param opts
   * @returns
   */
  static procDendron(opts: ProcDendron) {
    const { dest, engine, configOverride, fname, vault } = opts;
    if (dest === DendronASTDest.HTML) {
      throw Error("use procDendronHTML");
    }
    const proc = MDUtilsV4.procFull({
      engine,
      config: configOverride,
      fname,
      dest,
      vault,
    });
    return proc;
  }
}

/** Contains functions that help dealing with MarkDown Abstract Syntax Trees. */
export class MdastUtils {
  static genMDMsg(msg: string): Parent {
    return root(paragraph(text(msg)));
  }

  static genMDErrorMsg(msg: string): Parent {
    return root(blockquote(text(msg)));
  }

  /** Find the index of the list element for which the predicate `fn` returns true.
   *
   * @returns The index where the element was found, -1 otherwise.
   */
  static findIndex<T>(array: T[], fn: (node: T, index: number) => boolean) {
    for (var i = 0; i < array.length; i++) {
      if (fn(array[i], i)) {
        return i;
      }
    }
    return -1;
  }

  /** A simplified and adapted version of visitParents from unist-utils-visit-parents, that also keeps track of indices of the ancestors as well.
   *
   * The limitations are:
   * * `test`, if used, can only be a string representing the type of the node that you want to visit
   * * Adding or removing siblings is undefined behavior
   * Please modify this function to add support for these if needed.
   */
  static visitParentsIndices({
    nodes,
    test,
    visitor,
  }: {
    nodes: Node[];
    test?: string;
    visitor: VisitorParentsIndices;
  }) {
    function recursiveTraversal(
      nodes: Node[],
      ancestors: ParentWithIndex[]
    ): boolean | undefined {
      for (let i = 0; i < nodes.length; i++) {
        // visit the current node
        const node = nodes[i];
        let action: boolean | undefined | "skip";
        if (_.isUndefined(test) || node.type === test) {
          action = visitor({ node, index: i, ancestors });
        }
        if (action === "skip") return; // don't traverse the children of this node
        if (action === false) return false; // stop traversing completely

        // visit the children of this node, if any
        // @ts-ignore
        if (node.children) {
          const parent = node as Parent;
          const newAncestors = [...ancestors, { ancestor: parent, index: i }];
          const action = recursiveTraversal(parent.children, newAncestors);
          if (action === false) return; // stopping traversal
        }
      }
      return true; // continue traversal if needed
    }
    // Start recursion with no ancestors (everything is top level)
    recursiveTraversal(nodes, []);
  }

  /** Similar to `unist-utils-visit`, but allows async visitors.
   *
   * Children are visited in-order, not concurrently.
   *
   * @param test Use an empty list to visit all nodes, otherwise specify node types to be visited.
   * @param visitor Similar to `unist-util-visit`, returning true or undefined continues traversal, false stops traversal, and "skip" skips the children of that node.
   *
   * Depth-first pre-order traversal, same as `unist-util-visits`.
   */
  static async visitAsync(
    tree: Node,
    test: string[],
    visitor: (
      node: Node
    ) =>
      | void
      | undefined
      | boolean
      | "skip"
      | Promise<void | undefined | boolean | "skip">
  ) {
    const visitQueue = new FIFOQueue([tree]);
    while (visitQueue.length > 0) {
      const node = visitQueue.dequeue()!;
      if (test.length === 0 || test.includes(node.type)) {
        // eslint-disable-next-line no-await-in-loop
        const out = await visitor(node);
        if (out === false) return;
        if (out === "skip") continue;
      }
      if (RemarkUtils.isParent(node)) visitQueue.enqueueAll(node.children);
    }
  }

  static matchHeading(
    node: Node,
    text: string,
    opts: { depth?: number; slugger: ReturnType<typeof getSlugger> }
  ) {
    const { depth, slugger } = opts;
    if (node.type !== DendronASTTypes.HEADING) {
      return false;
    }

    // wildcard is always true
    if (text === "*") {
      return true;
    }

    if (text) {
      const headingText = toString(node);
      return text.trim().toLowerCase() === slugger.slug(headingText.trim());
    }

    if (depth) {
      return (node as Heading).depth <= depth;
    }

    return true;
  }
}

export class PublishUtils {
  static getAbsUrlForAsset(opts: {
    suffix?: string;
    config: IntermediateDendronConfig;
  }) {
    const suffix = opts.suffix || "";
    const { config } = opts;
    const assetsPrefix = ConfigUtils.getAssetsPrefix(config);
    const siteUrl = this.getSiteUrl(config);
    let sitePrefix = _.trimEnd(siteUrl, "/");
    if (assetsPrefix) {
      sitePrefix = _.join(
        [_.trimEnd(siteUrl, "/"), _.trim(assetsPrefix, "/")],
        "/"
      );
    }
    const out = _.trimEnd(_.join([sitePrefix, _.trim(suffix, "/")], "/"), "/");
    return out;
  }

  static getSiteUrl = (config: IntermediateDendronConfig) => {
    const publishingConfig = ConfigUtils.getPublishingConfig(config);
    if (getStage() !== "dev") {
      const siteUrl = process.env["SITE_URL"] || publishingConfig.siteUrl;
      return siteUrl;
    } else {
      return (
        "http://" +
        path.posix.join(`localhost:${process.env.ELEV_PORT || 8080}`)
      );
    }
  };
}
