import { DHookDict } from "./hooks";
import { SeedSite } from "./seed";

// === Promitives
export type DPermission = {
  read: string[];
  write: string[];
};
// === Vaults
export type RemoteEndpoint = {
  type: "git";
  url: string;
};
export enum DVaultVisibility {
  PRIVATE = "private",
}

export enum DVaultSync {
  SKIP = "skip",
  NO_PUSH = "noPush",
  NO_COMMIT = "noCommit",
  SYNC = "sync",
}

export type DVault = {
  /** Name of vault */
  name?: string;
  visibility?: DVaultVisibility;
  /** Filesystem path to fault */
  fsPath: string;
  /**
   * Indicate the workspace that this vault is part of
   */
  workspace?: string;
  remote?: RemoteEndpoint;
  // TODO
  userPermission?: DPermission;
  /**
   * If this is enabled, don't apply workspace push commands
   */
  noAutoPush?: boolean;
  /**
   * How the vault should be handled when using "add and commit" and "sync" commands.
   *
   * Options are:
   * * skip: Skip them entirely. You must manage the repository manually.
   * * noPush: Commit any changes and pull updates, but don't push. You can watch the repository and make local changes without sharing them back.
   * * noCommit: Pull and push updates if the workspace is clean, but don't commit. You manually commit your local changes, but automatically share them once you committed.
   * * sync: Commit changes, and pull and push updates. Treats workspace vaults like regular vaults.
   *
   * This setting overrides the `workspaceVaultSync` setting for the vault, even if the vault is a workspace vault.
   *
   * Defaults to `sync`.
   */
  sync?: DVaultSync;
  /**
   * Id of a seed this vault belongs to
   */
  seed?: string;
};

export type DWorkspace = {
  name: string;
  vaults: DVault[];
  remote: RemoteEndpoint;
};

export type DWorkspaceEntry = Omit<DWorkspace, "name" | "vaults">;
export type SeedEntry = {
  /**
   * Specific branch to pull from
   */
  branch?: string;
  /**
   * When in this seed, what url to use
   */
  site?: SeedSite;
};

export enum NoteAddBehavior {
  "childOfDomain" = "childOfDomain",
  "childOfDomainNamespace" = "childOfDomainNamespace",
  "childOfCurrent" = "childOfCurrent",
  "asOwnDomain" = "asOwnDomain",
}

export type JournalConfig = {
  dailyDomain: string;
  /**
   * If set, add all daily journals to specified vault
   */
  dailyVault?: string;
  name: string;
  dateFormat: string;
  addBehavior: NoteAddBehavior;
  /** 0 is Sunday, 1 is Monday, ... */
  firstDayOfWeek: number;
};

export type DendronConfig = {
  /**
   * Disable caching behavior
   */
  noCaching?: boolean;
  /**
   * Disable telemetry
   */
  noTelemetry?: boolean;
  /**
   * Dendron version. Setup by plugin
   @deprecated
   */
  version: number;
  /**
   * Dendron version
   */
  dendronVersion?: string;
  /**
   * Configuration related to publishing notes
   */
  site: DendronSiteConfig;

  journal: JournalConfig;

  /**
   * Workspaces
   */
  workspaces?: { [key: string]: DWorkspaceEntry | undefined };
  seeds?: { [key: string]: SeedEntry | undefined };
  /**
   * Dendron vaults in workspace.
   * Setup by plugin.
   */
  vaults: DVault[];
  hooks?: DHookDict;
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
   * Disable xvault wiki links
   */
  noXVaultWikiLink?: boolean;

  /**
   * Initialize remote vaults on startup
   * Default: true
   */
  initializeRemoteVaults?: boolean;

  /**
   * If true, enable feedback widget
   */
  feedback?: boolean;

  /**
   * If using backend API functionality
   */
  apiEndpoint?: string;

  /**
   * Default is templates
   */
  defaultInsertHierarchy?: string;

  /**
   * Development related options
   */
  dev?: DendronDevConfig;

  /**
   * How workspace vaults should be handled when using workspace "add and commit" and "sync" commands.
   *
   * Options are:
   * * skip: Skip them entirely. You must manage the repository manually.
   * * noPush: Commit any changes and pull updates, but don't push. You can watch the repository and make local changes without sharing them back.
   * * noCommit: Pull and push updates if the workspace is clean, but don't commit. You manually commit your local changes, but automatically share them once you committed.
   * * sync: Commit changes, and pull and push updates. Treats workspace vaults like regular vaults.
   *
   * Defaults to `noCommit`.
   */
  workspaceVaultSync?: DVaultSync;

  /**
   * Configuration for Random Note Lookup Command
   */
  randomNote?: RandomNoteConfig;

  /** Automatically fold frontmatter when opening a new note. False by default. */
  autoFoldFrontmatter?: boolean;
};

export type RandomNoteConfig = {
  /**
   * Hiearchies to include
   */
  include?: string[];

  /**
   * Hiearchies to exclude
   */
  exclude?: string[];
};

export type DendronDevConfig = {
  /**
   * Custom next server
   */
  nextServerUrl?: string;
  /**
   * Static assets for next
   */
  nextStaticRoot?: string;
  /**
   * What port to use for engine server. Default behavior is to create at startup
   */
  engineServerPort?: number;
  /**
   * Enable experimental web ui. Default is false
   */
  enableWebUI?: boolean;
  /**
   * Enable displaying and indexing link candidates. Default is false
   */
  enableLinkCandidates?: boolean;
  /**
   * Enable new preview as default
   */
  enablePreviewV2?: boolean;
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

  /** @deprecated anchors are now always "hidden, but reveal on mouseover" in published sites. */
  hideBlockAnchors?: boolean;

  /**
   * Do not display the randomly generated colors for tags. Only color tag links
   * if it has been configured in the frontmatter. False by default.
   */
  noRandomlyColoredTags?: boolean;

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
  /**
   * Set alternate port for preview
   * Default: 8080
   */
  previewPort?: boolean;

  /**
   * If set, value of your segment key
   */
  segmentKey?: string;

  /**
   * Required for auth
   */
  cognitoUserPoolId?: string;
  cognitoClientId?: string;
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

export type CleanDendronSiteConfig = DendronSiteConfig &
  Required<Pick<DendronSiteConfig, "siteIndex" | "siteUrl">>;

export enum DuplicateNoteAction {
  USE_VAULT = "useVault",
}

export type UseVaultBehaviorPayload = { vault: DVault } | string[];

export type UseVaultBehavior = {
  action: DuplicateNoteAction;
  payload: UseVaultBehaviorPayload;
};

export type DuplicateNoteBehavior = UseVaultBehavior;
