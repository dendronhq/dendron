import {
  DendronConfig,
  DNoteRefLink,
  DNoteRefLinkRaw,
  DVault,
  NoteProps,
} from "@dendronhq/common-all";
import { Heading, Parent, Root } from "mdast";
import { Processor } from "unified";
import { DendronPubOpts } from "./remark/dendronPub";
import { WikiLinksOpts } from "./remark/wikiLinks";
export { Node as UnistNode } from "unist";
export { VFile } from "vfile";
export { Processor };

// --- General

export type DendronASTRoot = Root & {
  children: DendronASTNode;
};

export type WikiLinkProps = {
  alias: string;
  value: string;
  anchorHeader?: string;
};

export type DendronASTNode = Parent & {
  notes?: NoteProps[];
  children?: Parent["children"] | DendronASTNode[];
};

export enum DendronASTTypes {
  WIKI_LINK = "wikiLink",
  REF_LINK = "refLink",
  REF_LINK_V2 = "refLinkV2",
  PARAGRAPH = "paragraph",
  BLOCK_ANCHOR = "blockAnchor",
  // Not dendron-specific, included here for convenience
  HEADING = "heading",
  LIST = "list",
}

export enum DendronASTDest {
  MD_ENHANCED_PREVIEW = "MD_ENHANCED_PREVIEW",
  MD_REGULAR = "MD_REGULAR",
  MD_DENDRON = "MD_DENDRON",
  HTML = "HTML",
}

export enum VaultMissingBehavior {
  FALLBACK_TO_ORIGINAL_VAULT,
  THROW_ERROR,
}

export type DendronASTData = {
  dest: DendronASTDest;
  vault: DVault;
  fname: string;
  wikiLinkOpts?: WikiLinksOpts;
  config: DendronConfig;
  overrides?: Partial<DendronPubOpts>;
  shouldApplyPublishRules?: boolean;
  /**
   * Inidicate that we are currently inside a note ref
   */
  insideNoteRef?: boolean;
};

// --- NODES

export type WikiLinkNoteV4 = DendronASTNode & {
  type: DendronASTTypes.WIKI_LINK;
  value: string;
  data: WikiLinkDataV4;
};

export type WikiLinkDataV4 = {
  alias: string;
  anchorHeader?: string;
  prefix?: string;
  vaultName?: string;
};

export type NoteRefNoteV4_LEGACY = DendronASTNode & {
  type: DendronASTTypes.REF_LINK;
  value: string;
  data: NoteRefDataV4_LEGACY;
};

export type NoteRefNoteV4 = Omit<DendronASTNode, "children"> & {
  type: DendronASTTypes.REF_LINK_V2;
  value: string;
  data: NoteRefDataV4;
};

export type NoteRefNoteRawV4 = Omit<DendronASTNode, "children"> & {
  type: DendronASTTypes.REF_LINK_V2;
  value: string;
  data: NoteRefDataRawV4;
};

export type NoteRefDataV4 = {
  link: DNoteRefLink;
  vaultName?: string;
};

export type NoteRefDataRawV4 = {
  link: DNoteRefLinkRaw;
  vaultName?: string;
};

export type NoteRefDataV4_LEGACY = {
  link: DNoteRefLink;
};

export type BlockAnchor = DendronASTNode & {
  type: DendronASTTypes.BLOCK_ANCHOR;
  id: string;
};

export type Anchor = BlockAnchor | Heading;
