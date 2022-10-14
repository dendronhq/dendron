import {
  DendronConfig,
  DNoteRefLink,
  DNoteRefLinkRaw,
  DVault,
  NoteProps,
  DendronASTDest,
} from "@dendronhq/common-all";
import { Heading, Image, Parent, Root } from "mdast";
import { Processor } from "unified";
import { DendronPubOpts } from "./remark/dendronPub";
import { WikiLinksOpts } from "./remark/wikiLinks";

export { Node as UnistNode } from "unist";
export { VFile } from "vfile";
export { Processor };
export { DendronASTDest };

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
  REF_LINK_V2 = "refLinkV2",
  BLOCK_ANCHOR = "blockAnchor",
  HASHTAG = "hashtag",
  USERTAG = "usertag",
  EXTENDED_IMAGE = "extendedImage",
  // Not dendron-specific, included here for convenience
  ROOT = "root",
  HEADING = "heading",
  LIST = "list",
  LIST_ITEM = "listItem",
  PARAGRAPH = "paragraph",
  TEXT = "text",
  TABLE = "table",
  TABLE_ROW = "tableRow",
  TABLE_CELL = "tableCell",
  IMAGE = "image",
  FRONTMATTER = "yaml",
  LINK = "link",
  CODE = "code",
  INLINE_CODE = "inlineCode",
  FOOTNOTE_DEFINITION = "footnoteDefinition",
  FOOTNOTE_REFERENCE = "footnoteReference",
  HTML = "html",
  YAML = "yaml",
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

export type WikiLinkNoteV4 = Omit<DendronASTNode, "children"> & {
  type: DendronASTTypes.WIKI_LINK;
  value: string;
  data: WikiLinkDataV4;
};

export type WikiLinkDataV4 = {
  alias: string;
  anchorHeader?: string;
  prefix?: string;
  vaultName?: string;
  /** Denotes a same file link, for example `[[#anchor]]` */
  sameFile?: boolean;
};

export type RehypeLinkData = WikiLinkDataV4 & {
  hName: string;
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

export type BlockAnchor = DendronASTNode & {
  type: DendronASTTypes.BLOCK_ANCHOR;
  id: string;
};

/** Hashtag tags, like `#foo.bar`, a shorthand for `[[tags.foo.bar]]` */
export type HashTag = DendronASTNode & {
  type: DendronASTTypes.HASHTAG;
  /** The fname that the hashtag actually references, like `tags.foo.bar` */
  fname: string;
  /** The full test of the hashtag, like `#foo.bar` */
  value: string;
};

/** User tags, like `@Hamilton.Margaret`, a shorthand for `[[user.Hamilton.Margaret]]` */
export type UserTag = DendronASTNode & {
  type: DendronASTTypes.USERTAG;
  /** The fname that the hashtag actually references, like `user.Hamilton.Margaret` */
  fname: string;
  /** The full test of the hashtag, like `@Hamilton.Margaret` */
  value: string;
};

export type Anchor = BlockAnchor | Heading;

export type ExtendedImage = DendronASTNode &
  Image & {
    /** User provided props, to set things like width and height. */
    props: { [key: string]: any };
  };
