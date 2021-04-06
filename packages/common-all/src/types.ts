import { DNodeType, DVault } from "./typesv2";

export type Stage = "dev" | "prod" | "test";

export type DEngineQuery = {
  queryString: string;
  mode: DNodeType;
  opts?: QueryOpts;
};

export type DEngineMode = "exact" | "fuzzy";

export interface QueryOpts {
  /**
   * Should add to full nodes
   */
  fullNode?: boolean;
  /**
   * Just get one result
   */
  queryOne?: boolean;
  /**
   * Use with `createIfNew`
   * If true, create a stub node.
   * A stub node is not written to disk
   */
  stub?: boolean;
  /**
   * If node does not exist, create it?
   */
  createIfNew?: boolean;
  // --- hints
  // DEPPRECATE
  webClient?: boolean;
  initialQuery?: boolean;
  mode?: DNodeType;
}

export interface Resp<T> {
  data: T;
  error?: Error | null;
}

export type DendronConfig = {
  /**
   * Dendron version. Setup by plugin
   */
  version: number;
  /**
   * Configuration related to publishing notes
   */
  site: DendronSiteConfig;
  /**
   * Dendron vaults in workspace.
   * Setup by plugin.
   */
  vaults: DVault[];
  /**
   * Pick vault when creating new note.
   * Docs: https://dendron.so/notes/24b176f1-685d-44e1-a1b0-1704b1a92ca0.html#specify-vault-location-when-creating-a-note
   */
  lookupConfirmVaultOnCreate?: boolean;
  /**
   * Use the title from frontmatter
   */
  useFMTitle?: boolean;

  /**
   * If true, use the note title when displaying naked links
   */
  useNoteTitleForLink?: boolean;

  /**
   * Use mermaid diagrams
   */
  mermaid?: boolean;

  /**
   * Use nunjucks templating
   */
  useNunjucks?: boolean;

  /**
   * Use pretty refs for preview
   */
  usePrettyRefs?: boolean;

  /**
   * Use katex for rendering math
   * default: true
   */
  useKatex?: boolean;

  /**
   * Shoud show hiearchy
   */
  hierarchyDisplay?: boolean;

  /**
   * Title used for hiearchies
   * Default: Children
   */
  hierarchyDisplayTitle?: string;

  /**
   * Don't automatically create note when looking up definition
   */
  noAutoCreateOnDefinition?: boolean;

  /**
   * Turn off legacy note refs;
   */
  noLegacyNoteRef?: boolean;

  /**
   * Initialize remote vaults on startup
   * Default: true
   */
  initializeRemoteVaults?: boolean;
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

export type DendronSiteFM = {
  published?: boolean;
  noindex?: boolean;
  nav_order?: number;
  nav_exclude?: boolean;
  permalink?: string;
  /**
   * If collection, don't show in nav
   * and have custom sorting rules
   */
  has_collection?: boolean;
  /**
   * Default: created
   */
  sort_by?: "created" | "title";
  sort_order?: "reverse" | "normal";
  skipLevels?: number;
};

export type CleanDendronSiteConfig = DendronSiteConfig &
  Required<Pick<DendronSiteConfig, "siteIndex" | "siteUrl">>;

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
   * If set, path to a custom header to include in published sites
   */
  customHeaderPath?: string;

  /**
   * If set, use google analytics to track users
   */
  ga_tracking?: string;

  /**
   * Path to favicon. Relative to workspace.
   * Default: "favicon.ico"
   */
  siteFaviconPath?: string;

  /**
   * Path to site logo
   */
  logo?: string;

  /**
   * By default, the domain of your `siteHiearchies` page
   */
  siteIndex?: string;

  /**
   * Hiearchies to publish
   */
  siteHierarchies: string[];

  /**
   * If true, show a last modified on the site
   */
  siteLastModified?: boolean;

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
   * @deprecated: no longer used in 11ty
   */
  siteNotesDir?: string;

  /**
   * Url of site without trailing slash
   * eg. dendron.so
   */
  siteUrl?: string;

  /**
   * Cname used for github pages
   * - default: none
   */
  githubCname?: string;

  /**
   * If set, add edit on github to this site"
   */
  gh_edit_link?: string;
  gh_edit_link_text?: string;
  gh_edit_branch?: string;
  gh_edit_view_mode?: "tree" | "edit";
  gh_edit_repository?: string;

  /**
   * Pretty refs help you identify when content is embedded from
   * elsewhere and provide links back to the source
   */
  usePrettyRefs?: boolean;

  /**
   * Control publication on a per hierarchy basis
   */
  config?: { [key: string]: HierarchyConfig };

  /**
   * When publishing in multi-vault scenario,
   * how to handle duplicate notes
   */
  duplicateNoteBehavior?: DuplicateNoteBehavior;

  /**
   * When publishing, should stubs be written to disk?
   * Default: true
   * NOTE: if this isn't set to true, will cause
   * stub notes to be published with different ids each time
   */
  writeStubs?: boolean;

  /**
   * SEO related values
   */
  title?: string;
  description?: string;
  author?: string;
  twitter?: string;
  image?: string;

  /**
   * Use {@link https://github.com/Nevenall/remark-containers} in published site
   */
  useContainers?: boolean;

  /**
   * Generate changelog for published site
   * Default: false
   */
  generateChangelog?: boolean;
};

export enum DuplicateNoteAction {
  USE_VAULT = "useVault",
}

export type UseVaultBehaviorPayload = { vault: DVault } | string[];

export type UseVaultBehavior = {
  action: DuplicateNoteAction;
  payload: UseVaultBehaviorPayload;
};

export type DuplicateNoteBehavior = UseVaultBehavior;
