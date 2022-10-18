import { DVault } from "../../DVault";
import { GiscusConfig } from "./giscus";
import { GithubConfig, genDefaultGithubConfig, githubSchema } from "./github";
import { SEOConfig, genDefaultSEOConfig, seoSchema } from "./seo";
import { z, schemaForType } from "../../../parse";

export enum Theme {
  DARK = "dark",
  LIGHT = "light",
  CUSTOM = "custom",
}

export enum SearchMode {
  SEARCH = "search",
  LOOKUP = "lookup",
}

const searchModeSchema = z.enum([SearchMode.SEARCH, SearchMode.LOOKUP]);

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
  github?: GithubConfig;
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

export type DuplicateNoteAction = "useVault";

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

export const publishingSchema = schemaForType<DendronPublishingConfig>()(
  z
    .object({
      enableFMTitle: z.boolean().optional().default(true),
      // enableHierarchyDisplay?: boolean;
      // hierarchyDisplayTitle?: string;
      enableNoteTitleForLink: z.boolean().optional().default(true),
      enablePrettyRefs: z.boolean().optional().default(true),
      // enableBackLinks?: boolean;
      enableKatex: z.boolean().optional().default(true),
      //
      // assetsPrefix?: string;
      copyAssets: z.boolean().default(true),
      //
      // canonicalBaseUrl?: string;
      // customHeaderPath?: string;
      // ga?: GoogleAnalyticsConfig;
      // logoPath?: string;
      // siteFaviconPath?: string;
      // siteIndex?: string;
      siteHierarchies: z.array(z.string()).default(["root"]),
      writeStubs: z.boolean().default(false),
      siteRootDir: z.string().default("docs"),
      seo: seoSchema,
      github: githubSchema.optional(),
      enableSiteLastModified: z.boolean().default(true),
      // siteUrl?: string;
      enableFrontmatterTags: z.boolean().default(true),
      enableHashesForFMTags: z.boolean().default(false),
      enableRandomlyColoredTags: z.boolean().optional().default(true),
      enableTaskNotes: z.boolean().optional().default(true),
      // hierarchy?: { [key: string]: HierarchyConfig };
      // duplicateNoteBehavior?: DuplicateNoteBehavior;
      // theme?: Theme;
      // segmentKey?: string;
      // cognitoUserPoolId?: string;
      // cognitoClientId?: string;
      enablePrettyLinks: z.boolean().default(true),
      // siteBanner?: string;
      // giscus?: GiscusConfig;
      // sidebarPath?: string | false;
      searchMode: searchModeSchema.optional().default(SearchMode.LOOKUP),
    })
    .passthrough()
);

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
