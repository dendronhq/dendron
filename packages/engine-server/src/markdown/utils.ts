/* eslint-disable no-plusplus */
import {
  ConfigUtils,
  DendronError,
  DEngineClient,
  DVault,
  FIFOQueue,
  getSlugger,
  getStage,
  IntermediateDendronConfig,
  NoteProps,
  VaultUtils,
} from "@dendronhq/common-all";
// @ts-ignore
// @ts-ignore
import _ from "lodash";
import { Heading } from "mdast";
import { blockquote, paragraph, root, text } from "mdast-builder";
import path from "path";
// @ts-ignore
// @ts-ignore
// @ts-ignore
// eslint-disable-next-line import/no-named-default
import { default as Unified, Processor } from "unified";
import { Node, Parent } from "unist";
import { normalizev2 } from "../utils";
import { RemarkUtils } from "./remark";
import { BlockAnchorOpts } from "./remark/blockAnchors";
import { DendronPubOpts } from "./remark/dendronPub";
import { NoteRefsOptsV2 } from "./remark/noteRefsV2";
import { WikiLinksOpts } from "./remark/wikiLinks";
import {
  DendronASTData,
  DendronASTDest,
  DendronASTNode,
  DendronASTTypes,
  VaultMissingBehavior,
} from "./types";

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

export type FindHeaderAnchor = {
  type: "header";
  index: number;
  node?: Heading;
  anchorType?: "header";
};

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

  static setProcOpts(proc: Unified.Processor, data: Partial<ProcOptsFull>) {
    const procOpts = proc.data(DendronProcDataKeys.PROC_OPTS) as ProcOptsFull;
    return proc.data(DendronProcDataKeys.PROC_OPTS, { ...procOpts, ...data });
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

  static findHeader({
    nodes,
    match,
    slugger,
  }: {
    nodes: DendronASTNode["children"];
    match: string | Heading;
    slugger?: ReturnType<typeof getSlugger>;
  }): FindHeaderAnchor | null {
    const cSlugger = slugger ?? getSlugger();
    const cMatchText = _.isString(match)
      ? match
      : normalizev2(toString(match), getSlugger());
    let foundNode: Node | undefined;

    const foundIndex = MdastUtils.findIndex(
      nodes,
      (node: Node, idx: number) => {
        if (idx === 0 && match === "*") {
          return false;
        }
        const out = MdastUtils.matchHeading(node, cMatchText, {
          slugger: cSlugger,
        });
        if (out) {
          foundNode = node;
        }
        return out;
      }
    );
    if (foundIndex < 0) return null;
    return {
      type: "header",
      index: foundIndex,
      node: foundNode as Heading,
      anchorType: "header",
    };
  }

  /** Find the index of the list element for which the predicate `fn` returns true.
   *
   * @returns The index where the element was found, -1 otherwise.
   */
  static findIndex<T>(array: T[], fn: (node: T, index: number) => boolean) {
    for (let i = 0; i < array.length; i++) {
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
    matchText: string,
    opts: { depth?: number; slugger: ReturnType<typeof getSlugger> }
  ) {
    const { depth, slugger } = opts;
    if (node.type !== DendronASTTypes.HEADING) {
      return false;
    }

    // wildcard is always true
    if (matchText === "*") {
      return true;
    }

    if (matchText) {
      const headingText = toString(node);
      return (
        matchText.trim().toLowerCase() === slugger.slug(headingText.trim())
      );
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
