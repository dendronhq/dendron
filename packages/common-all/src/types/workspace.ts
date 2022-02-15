import { URI } from "vscode-uri";
import { DHookDict } from "./hooks";
import { SeedSite } from "./seed";
import { DEngineClient } from "./typesv2";
import { IntermediateDendronConfig } from "./intermediateConfigs";

// === Primitives
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

export enum WorkspaceType {
  NATIVE = "NATIVE",
  CODE = "CODE",
  NONE = "NONE",
}

export type DWorkspaceV2 = {
  /**
   * Absolute path to the workspace directory
   */
  wsRoot: string;
  type: WorkspaceType;
  config: IntermediateDendronConfig;
  vaults: DVault[];
  engine: DEngineClient;
  /**
   * Where are assets stored (eg. tutorial workspace)
   */
  assetUri: URI;
  /**
   * Log storage
   */
  logUri: URI;
};

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

/**
 * Extension Install Status
 */
export enum InstallStatus {
  NO_CHANGE = "NO_CHANGE",
  INITIAL_INSTALL = "INITIAL_INSTALL",
  UPGRADED = "UPGRADED",
}

export enum LegacyNoteAddBehavior {
  "childOfDomain" = "childOfDomain",
  "childOfDomainNamespace" = "childOfDomainNamespace",
  "childOfCurrent" = "childOfCurrent",
  "asOwnDomain" = "asOwnDomain",
}

export enum LegacyLookupSelectionType {
  "selection2link" = "selection2link",
  "selectionExtract" = "selectionExtract",
  "none" = "none",
}

export type LegacyNoteLookupConfig = {
  selectionType: LegacyLookupSelectionType;
  leaveTrace: boolean;
};

export type LegacyLookupConfig = {
  note: LegacyNoteLookupConfig;
};

export enum LegacyInsertNoteLinkAliasMode {
  "snippet" = "snippet",
  "selection" = "selection",
  "title" = "title",
  "prompt" = "prompt",
  "none" = "none",
}

export type LegacyInsertNoteLinkConfig = {
  aliasMode: LegacyInsertNoteLinkAliasMode;
  multiSelect: boolean;
};

export type LegacyJournalConfig = {
  dailyDomain: string;
  /**
   * If set, add all daily journals to specified vault
   */
  dailyVault?: string;
  name: string;
  dateFormat: string;
  addBehavior: LegacyNoteAddBehavior;
  /** 0 is Sunday, 1 is Monday, ... */
  firstDayOfWeek: number;
};

export type LegacyScratchConfig = Pick<
  LegacyJournalConfig,
  "name" | "dateFormat" | "addBehavior"
>;

export type DendronConfig = {
  /**
   * Disable caching behavior
   */
  noCaching?: boolean;

  /** Maximum number of rendered previews to cache in Dendron Engine.
   *  Note: this value is ignored when {@link DendronConfig.noCaching} is set to true.
   *  When set this value must be greater than 0. */
  maxPreviewsCached?: number;

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

  /**
   * Configuration related to lookup v3.
   */
  lookup: LegacyLookupConfig;

  journal: LegacyJournalConfig;

  scratch?: LegacyScratchConfig;

  insertNoteLink?: LegacyInsertNoteLinkConfig;

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
   * When set to true `Create New` will not bubble up to the top of lookup results.
   *
   * default: false.
   * */
  lookupDontBubbleUpCreateNew?: boolean;

  /**
   * Pick vault when creating new note.
   * [Docs](https://dendron.so/notes/24b176f1-685d-44e1-a1b0-1704b1a92ca0.html#specify-vault-location-when-creating-a-note)
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
   * Enable mermaid diagram sytnax
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
   * Configuration for note and schema graphs
   */
  graph?: LegacyDendronGraphConfig;

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
  randomNote?: LegacyRandomNoteConfig;

  /** Automatically fold frontmatter when opening a new note. False by default. */
  autoFoldFrontmatter?: boolean;

  /**
   * Configuration for Insert Note Index Command
   */
  insertNoteIndex?: LegacyInsertNoteIndexConfig;

  /** Notes that are too large can cause serious slowdowns for Dendron. For
   * notes longer than this many characters, some features like backlinks will
   * be disabled to avoid slowdowns. Other functionality like note lookups will
   * continue to function.
   *
   * Defaults to 204800 characters, which is about 200 KiB.
   */
  maxNoteLength?: number;

  /**
   * Do not display the randomly generated colors for tags in the **editor**. Only
   * color tag links if it has been configured in the frontmatter. False by
   * default.
   */
  noRandomlyColoredTags?: boolean;
};

export type LegacyRandomNoteConfig = {
  /**
   * Hiearchies to include
   */
  include?: string[];

  /**
   * Hiearchies to exclude
   */
  exclude?: string[];
};

export type LegacyInsertNoteIndexConfig = {
  /**
   * Include marker when inserting note index.
   */
  marker?: boolean;
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
  /** Force the use of a specific type of watcher.
   *
   * - plugin: Uses VSCode's builtin watcher
   * - engine: Uses the engine watcher, watching the files directly without VSCode
   */
  forceWatcherType?: "plugin" | "engine";
  /**
   * Enable export pod v2
   */
  enableExportPodV2?: boolean;
};

export type DendronSiteConfig = {
  /**
   * If set, add prefix to all asset links
   */
  assetsPrefix?: string;

  /**
   * Use this as root for creating canonical url for sites
   */
  canonicalBaseUrl?: string;

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
   * By default, the domain of your `siteHierarchies` page
   */
  siteIndex?: string;

  /**
   * Hierarchies to publish
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

  /** Whether frontmatter tags should be rendered in published websites. Defaults to true. */
  showFrontMatterTags?: boolean;

  /**
   * Do not display the randomly generated colors for tags. Only color tag links
   * if it has been configured in the frontmatter. False by default.
   */
  noRandomlyColoredTags?: boolean;

  /**
   * Control publication on a per hierarchy basis
   */
  config?: { [key: string]: LegacyHierarchyConfig };

  /**
   * When publishing in multi-vault scenario,
   * how to handle duplicate notes
   */
  duplicateNoteBehavior?: LegacyDuplicateNoteBehavior;

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
  /** Default SEO image for published pages */
  image?: {
    url: string;
    alt: string;
  };

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

  /**
   * notes are published without the .html file extension
   */
  usePrettyLinks?: boolean;

  /** Display a `#` symbol in front of frontmatter tags in the tags listing. False by default. */
  useHashesForFMTags?: boolean;
};

export type LegacyDendronGraphConfig = {
  zoomSpeed: number;
};

export type LegacyHierarchyConfig = {
  publishByDefault?: boolean | { [key: string]: boolean };
  noindexByDefault?: boolean;
  customFrontmatter?: LegacyCustomFMEntry[];
};

export type LegacyCustomFMEntry = {
  key: string;
  value: any;
};

export type CleanDendronSiteConfig = DendronSiteConfig &
  Required<Pick<DendronSiteConfig, "siteIndex" | "siteUrl">>;

export enum LegacyDuplicateNoteAction {
  USE_VAULT = "useVault",
}

export type LegacyUseVaultBehaviorPayload = { vault: DVault } | string[];

export type LegacyUseVaultBehavior = {
  action: LegacyDuplicateNoteAction;
  payload: LegacyUseVaultBehaviorPayload;
};

export type LegacyDuplicateNoteBehavior = LegacyUseVaultBehavior;
