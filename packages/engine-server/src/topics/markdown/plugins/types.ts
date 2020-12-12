import { DNoteLoc, DNoteRefLink, NotePropsV2 } from "@dendronhq/common-all";
import MDAST from "mdast";

export enum DendronASTTypes {
  WIKI_LINK = "wikiLink",
  REF_LINK = "refLink",
  PARAGRAPH = "paragraph",
}

export enum DendronASTDest {
  MD_ENHANCED_PREVIEW,
  MD_REGULAR,
  HTML,
}

// --- General

export type DendronASTData = {
  dest: DendronASTDest;
};

// @deprecate
export type LinkOpts = {
  toMdEnhancedPreview?: boolean;
};

export type DendronASTNode = MDAST.Parent & {
  notes?: NotePropsV2[];
};

// --- WIKI Link
export type RefLinkNote = DendronASTNode & {
  type: DendronASTTypes.REF_LINK;
  data: RefLinkData;
  value: string;
};

export type RefLinkData = {
  link: DNoteRefLink;
  // --- Old
  alias: string;
  permalink: string;
  exists: boolean;
  hName: string;
  hProperties: any;
  hChildren: any[];
  toMd?: boolean;
  prefix?: string;
  useId: boolean;
};

export type WikiLinkNote = DendronASTNode & {
  type: DendronASTTypes.WIKI_LINK;
  data: WikiLinkData;
  value: string;
};

export type WikiLinkData = {
  alias: string;
  permalink: string;
  exists: boolean;
  hName: string;
  hProperties: {
    className: string;
    href: string;
  };
  hChildren: any[];
  anchorHeader?: string;

  // dendron specific
  toMd?: boolean;
  toHTML?: boolean;
  /**
   * {ROOT_URL}/{prefix?}/{destination}
   */
  prefix?: string;
  useId: boolean;
  note?: { id: string };
  replace?: DNoteLoc;
  forNoteRefInPreview?: boolean;
  forNoteRefInSite?: boolean;
} & LinkOpts;
