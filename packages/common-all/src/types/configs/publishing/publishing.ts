import { DVault } from "../../workspace";
import { GithubConfig, genDefaultGithubConfig } from "./github";
import { SEOConfig, genDefaultSEOConfig } from "./seo";

/**
 * Namespace for all publishing related configurations
 */
export type DendronPublishingConfig = {
  enableFMTitle?: boolean; // TODO: split implementation to respect non-global config
  enableHierarchyDisplay?: boolean; // TODO: split
  hierarchyDisplayTitle?: string; // TODO: split
  enableNoteTitleForLink?: boolean; // TODO: split
  enableMermaid?: boolean;
  enablePrettyRefs?: boolean;
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
  siteRepoDir?: string;
  siteUrl?: string;
  enableFrontmatterTags: boolean;
  enableRandomlyColoredTags?: boolean;
  hierarchy?: { [key: string]: HierarchyConfig };
  duplicateNoteBehavior?: DuplicateNoteBehavior;
  writeStubs: boolean;
  seo: SEOConfig;
  github: GithubConfig;
  enableContainers: boolean;
  generateChangelog: boolean;

  previewPort?: number;
  segmentKey?: string;
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
  enablePrettyLinks: boolean;
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
  noindexByDefault?: boolean;
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
    copyAssets: true,
    enablePrettyRefs: true,
    siteHierarchies: ["root"],
    writeStubs: false,
    enableContainers: false,
    generateChangelog: false,
    siteRootDir: "docs",
    seo: genDefaultSEOConfig(),
    github: genDefaultGithubConfig(),
    enableSiteLastModified: true,
    enableFrontmatterTags: true,
    enableRandomlyColoredTags: true,
    enablePrettyLinks: true,
  };
}
