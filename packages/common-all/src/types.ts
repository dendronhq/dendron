export type Stage = "dev" | "prod" | "test";

export interface Resp<T> {
  data: T;
  error?: Error | null;
}

export type DendronConfig = {
  site: DendronSiteConfig;
};

export type HierarchyConfig = {
  publishByDefault?: boolean;
  noindexByDefault?: boolean;
  customFrontmatter?: CustomFMEntry[];
};

export type CustomFMEntry = {
  key: string;
  value: any;
};

export type DendronSiteConfig = {
  /**
   * If set, add prefix to all asset links
   */
  assetsPrefix?: string;

  /**
   * Copy assets from vault to site.
   * Default: true
   */
  copyAssets?: boolean;

  /**
   * By default, the domain of your siteHiearchies page
   */
  siteIndex?: string;
  /**
   * Hiearchies to publish
   */
  siteHierarchies: string[];

  /**
   * Where your site will be published.
   * Relative to Dendron workspace
   */
  siteRootDir: string;

  /**
   * Location of the github repo where your site notes are located.
   * By default, this is assumed to be your `workspaceRoot` if not set.
   */
  siteRepoDir?: string;

  /**
   * Folder where your notes will be kept. By default, "notes"
   */
  siteNotesDir?: string;

  usePrettyRefs?: boolean;

  /**
   * Control publication on a per hierarchy basis
   */
  config?: { [key: string]: HierarchyConfig };
};
