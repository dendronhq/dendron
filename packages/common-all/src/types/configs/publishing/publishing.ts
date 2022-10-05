import { DVault } from "../../DVault";
import { GiscusConfig } from "./giscus";
import { GithubConfig, genDefaultGithubConfig } from "./github";
import { SEOConfig, genDefaultSEOConfig } from "./seo";

export enum Theme {
  DARK = "dark",
  LIGHT = "light",
  CUSTOM = "custom",
}

export enum SearchMode {
  SEARCH = "search",
  LOOKUP = "lookup",
}

/**
 * Namespace for all publishing related configurations
 */
export type DendronPublishingConfig = {
  enableFMTitle?: boolean; // TODO: split implementation to respect non-global config
  enableHierarchyDisplay?: boolean; // TODO: split
  hierarchyDisplayTitle?: string; // TODO: split
  enableNoteTitleForLink?: boolean; // TODO: split
  enablePrettyRefs?: boolean;
  enableBackLinks?: boolean;
  enableKatex?: boolean;

  assetsPrefix?: string;
  copyAssets: boolean;

  canonicalBaseUrl?: string;
  customHeaderPath?: string;
  ga?: GoogleAnalyticsConfig;
  logoPath?: string;
  siteFaviconPath?: string;
  siteIndex?: string;
  siteHierarchies: string[];
  enableSiteLastModified: boolean;
  siteRootDir: string;
  siteUrl?: string;
  enableFrontmatterTags: boolean;
  enableHashesForFMTags: boolean;
  enableRandomlyColoredTags?: boolean;
  enableTaskNotes?: boolean;
  hierarchy?: { [key: string]: HierarchyConfig };
  duplicateNoteBehavior?: DuplicateNoteBehavior;
  writeStubs: boolean;
  seo: SEOConfig;
  github: GithubConfig;
  theme?: Theme;
  segmentKey?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
  enablePrettyLinks: boolean;
  siteBanner?: string;
  giscus?: GiscusConfig;
  sidebarPath?: string | false;
  searchMode?: SearchMode;
};

export type CleanDendronPublishingConfig = DendronPublishingConfig &
  Required<Pick<DendronPublishingConfig, "siteIndex" | "siteUrl">>;

export enum DuplicateNoteActionEnum {
  useVault = "useVault",
}

export type DuplicateNoteAction = keyof typeof DuplicateNoteActionEnum;

export type UseVaultBehaviorPayload = { vault: DVault } | string[];

export type DuplicateNoteActionPayload = UseVaultBehaviorPayload;

export type UseVaultBehavior = {
  action: DuplicateNoteAction;
  payload: DuplicateNoteActionPayload;
};

export type DuplicateNoteBehavior = UseVaultBehavior;

export type HierarchyConfig = {
  publishByDefault?: boolean | { [key: string]: boolean };
  customFrontmatter?: CustomFMEntry[];
};

export type CustomFMEntry = {
  key: string;
  value: any;
};

export type GoogleAnalyticsConfig = {
  tracking?: string;
};

/**
 * Generate default {@link DendronPublishingConfig}
 * @returns DendronPublishingConfig
 */
export function genDefaultPublishingConfig(): DendronPublishingConfig {
  return {
    enableFMTitle: true,
    enableNoteTitleForLink: true,
    enablePrettyRefs: true,
    enableKatex: true,
    copyAssets: true,
    siteHierarchies: ["root"],
    writeStubs: false,
    siteRootDir: "docs",
    seo: genDefaultSEOConfig(),
    github: genDefaultGithubConfig(),
    enableSiteLastModified: true,
    enableFrontmatterTags: true,
    enableHashesForFMTags: false,
    enableRandomlyColoredTags: true,
    enableTaskNotes: true,
    enablePrettyLinks: true,
    searchMode: SearchMode.LOOKUP,
  };
}
