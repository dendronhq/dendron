import {
  DendronSiteConfig,
  DNoteRefLink,
  DVault,
  NotePropsV2,
} from "@dendronhq/common-all";
import { Parent } from "mdast";
import { Processor } from "unified";
import { WikiLinksOpts } from "./remark/wikiLinks";

export type DendronASTNode = Parent & {
  notes?: NotePropsV2[];
  children?: Parent["children"] | DendronASTNode[];
};

export enum DendronASTTypes {
  WIKI_LINK = "wikiLink",
  REF_LINK = "refLink",
  PARAGRAPH = "paragraph",
}

export enum DendronASTDest {
  MD_ENHANCED_PREVIEW = "MD_ENHANCED_PREVIEW",
  MD_REGULAR = "MD_REGULAR",
  MD_DENDRON = "MD_DENDRON",
  HTML = "HTML",
}

export type DendronASTData = {
  dest: DendronASTDest;
  vault?: DVault;
  fname?: string;
  wikiLinkOpts?: WikiLinksOpts;
  config?: DendronSiteConfig;
};

// NODES

export type WikiLinkNoteV4 = DendronASTNode & {
  type: DendronASTTypes.WIKI_LINK;
  value: string;
  data: WikiLinkDataV4;
};

export type WikiLinkDataV4 = {
  alias: string;
  anchorHeader?: string;
  prefix?: string;
};

export type NoteRefNoteV4 = DendronASTNode & {
  type: DendronASTTypes.REF_LINK;
  value: string;
  data: NoteRefDataV4;
};

export type NoteRefDataV4 = {
  link: DNoteRefLink;
};

export { Processor };
