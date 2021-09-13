import { DVault } from "../../workspace";
import { GithubConfig, genDefaultGithubConfig } from "./github";
import { SEOConfig, genDefaultSEOConfig } from "./seo";

/**
 * Namespace for all publishing related configurations
 */
export type DendronPublishingConfig = {
  enableFMTitle: boolean; // TODO: split implementation to respect non-global config
  enableHierarchyDisplay: boolean; // TODO: split
  hierarchyDisplayTitle: string; // TODO: split
  enableNoteTitleForLink: boolean; // TODO: split
  enableMermaid: boolean;
  enableNunjucks: boolean;
  enablePrettyRefs: boolean;
  enableKatex: boolean;
  enableLegacyNoteRef: boolean;

  assetsPrefix?: string;
  copyAssets: boolean;

  canonicalBaseUrl?: string;
  customHeaderPath?: string;
  ga?: GoogleAnalyticsConfig;
  logo?: string;
  siteFaviconPath?: string;
  siteIndex?: string;
  siteHierarchies: string[];
  displaySiteLastModified: boolean;
  siteRootDir: string;
  siteRepoDir?: string;
  siteUrl?: string;
  enableFrontMatterTags: boolean;
  enableRandomlyColoredTags?: boolean;
  config?: { [key: string]: HierarchyConfig };
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

export enum DuplicateNoteActionEnum {
  useVault = "useVault",
}

export type DuplicateNoteAction = keyof typeof DuplicateNoteActionEnum;

export type UseVaultBehaviorPayload = { vault: DVault } | string[];

export type DuplicateNoteActionPayload = UseVaultBehaviorPayload;

export type DuplicateNoteBehavior = {
  action: DuplicateNoteAction;
  payload: DuplicateNoteActionPayload;
};

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
    enableFMTitle: true,
    enableHierarchyDisplay: true,
    hierarchyDisplayTitle: "children",
    enableNoteTitleForLink: true,
    enableMermaid: true,
    enableKatex: true,
    enableNunjucks: false,
    enablePrettyRefs: true,
    enableLegacyNoteRef: false,
    copyAssets: true,
    siteHierarchies: ["root"],
    writeStubs: false,
    enableContainers: false,
    generateChangelog: false,
    siteRootDir: "docs",
    seo: genDefaultSEOConfig(),
    github: genDefaultGithubConfig(),
    displaySiteLastModified: true,
    enableFrontMatterTags: true,
    enableRandomlyColoredTags: true,
    enablePrettyLinks: true,
  };
}
