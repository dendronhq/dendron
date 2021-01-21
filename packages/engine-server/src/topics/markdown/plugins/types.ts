import { DNoteLoc, DNoteRefLink } from "@dendronhq/common-all";
import { DendronASTNode, DendronASTTypes } from "../../../markdown/types";

// --- General

// @deprecate
export type LinkOpts = {
  toMdEnhancedPreview?: boolean;
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

export type WikiLinkProps = {
  alias: string;
  value: string;
  anchorHeader?: string;
  filters?: LinkFilter[];
};

export type LinkFilter = {
  name: string;
};
