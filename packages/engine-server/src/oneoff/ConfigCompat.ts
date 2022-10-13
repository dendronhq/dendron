/* eslint-disable camelcase */
import {
  ConfigUtils,
  DendronConfig,
  DendronDevConfig,
  DHookDict,
  DVault,
  DVaultSync,
} from "@dendronhq/common-all";
import _ from "lodash";
import { DEPRECATED_PATHS, MigrationUtils, PATH_MAP } from "../migrations";

type DendronConfigV4 = {
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
  workspaces?: { [key: string]: any | undefined };
  seeds?: { [key: string]: any | undefined };
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
   * Should show hierarchy
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

enum LegacyNoteAddBehavior {
  "childOfDomain" = "childOfDomain",
  "childOfDomainNamespace" = "childOfDomainNamespace",
  "childOfCurrent" = "childOfCurrent",
  "asOwnDomain" = "asOwnDomain",
}

enum LegacyLookupSelectionType {
  "selection2link" = "selection2link",
  "selectionExtract" = "selectionExtract",
  "none" = "none",
}

type LegacyNoteLookupConfig = {
  selectionType: LegacyLookupSelectionType;
  leaveTrace: boolean;
};

type LegacyLookupConfig = {
  note: LegacyNoteLookupConfig;
};

enum LegacyInsertNoteLinkAliasMode {
  "snippet" = "snippet",
  "selection" = "selection",
  "title" = "title",
  "prompt" = "prompt",
  "none" = "none",
}

type LegacyInsertNoteLinkConfig = {
  aliasMode: LegacyInsertNoteLinkAliasMode;
  multiSelect: boolean;
};

type LegacyJournalConfig = {
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

type LegacyScratchConfig = Pick<
  LegacyJournalConfig,
  "name" | "dateFormat" | "addBehavior"
>;

type LegacyRandomNoteConfig = {
  /**
   * Hiearchies to include
   */
  include?: string[];

  /**
   * Hiearchies to exclude
   */
  exclude?: string[];
};

type LegacyInsertNoteIndexConfig = {
  /**
   * Include marker when inserting note index.
   */
  marker?: boolean;
};

type DendronSiteConfig = {
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

type LegacyDendronGraphConfig = {
  zoomSpeed: number;
};

type LegacyHierarchyConfig = {
  publishByDefault?: boolean | { [key: string]: boolean };
  noindexByDefault?: boolean;
  customFrontmatter?: LegacyCustomFMEntry[];
};

type LegacyCustomFMEntry = {
  key: string;
  value: any;
};

enum LegacyDuplicateNoteAction {
  USE_VAULT = "useVault",
}

type LegacyUseVaultBehaviorPayload = { vault: DVault } | string[];

type LegacyUseVaultBehavior = {
  action: LegacyDuplicateNoteAction;
  payload: LegacyUseVaultBehaviorPayload;
};

type LegacyDuplicateNoteBehavior = LegacyUseVaultBehavior;

type IntermediateNewConfig = Partial<
  Pick<DendronConfig, "commands" | "workspace" | "preview" | "publishing">
>;

type IntermediateOldConfig = Partial<DendronConfigV4> &
  Required<Pick<DendronConfigV4, "version">>;

type StrictConfigV4 = IntermediateOldConfig &
  IntermediateNewConfig &
  Required<Pick<IntermediateNewConfig, "commands" | "workspace" | "preview">> &
  Required<Pick<IntermediateOldConfig, "site">> & {
    version: 4;
  };

// ===

export class DConfigLegacy {
  static configIsV4(config: any): config is StrictConfigV4 {
    return config.version === 4;
  }

  static v4ToV5(config: StrictConfigV4): DendronConfig {
    return v4ToV5({ legacyConfig: config });
  }
}

const v4ToV5 = ({ legacyConfig }: { legacyConfig: any }) => {
  const defaultV5Config = ConfigUtils.genDefaultConfig();
  const rawDendronConfig = legacyConfig;

  // remove all null properties
  const cleanDendronConfig = MigrationUtils.deepCleanObjBy(
    rawDendronConfig,
    _.isNull
  );

  if (_.isUndefined(cleanDendronConfig.commands)) {
    cleanDendronConfig.commands = {};
  }

  if (_.isUndefined(cleanDendronConfig.workspace)) {
    cleanDendronConfig.workspace = {};
  }

  if (_.isUndefined(cleanDendronConfig.preview)) {
    cleanDendronConfig.preview = {};
  }

  if (_.isUndefined(cleanDendronConfig.publishing)) {
    cleanDendronConfig.publishing = {};
  }

  // legacy paths to remove from config;
  const legacyPaths: string[] = [];
  // migrate each path mapped in current config version
  PATH_MAP.forEach((value, key) => {
    const { target: legacyPath, preserve } = value;
    let iteratee = value.iteratee;
    let valueToFill;
    let alreadyFilled;

    if (iteratee !== "skip") {
      alreadyFilled = _.has(cleanDendronConfig, key);
      const maybeLegacyConfig = _.get(cleanDendronConfig, legacyPath);
      if (_.isUndefined(maybeLegacyConfig)) {
        // legacy property doesn't have a value.
        valueToFill = _.get(defaultV5Config, key);
      } else {
        // there is a legacy value.
        // check if this mapping needs special treatment.
        if (_.isUndefined(iteratee)) {
          // assume identity mapping.
          iteratee = _.identity;
        }
        valueToFill = iteratee(maybeLegacyConfig);
      }
    }

    if (!alreadyFilled && !_.isUndefined(valueToFill)) {
      // if the property isn't already filled, fill it with determined value.
      _.set(cleanDendronConfig, key, valueToFill);
    }

    // these will later be used to delete.
    // only push if we aren't preserving target.
    if (!preserve) {
      legacyPaths.push(legacyPath);
    }
  });

  // set config version.
  _.set(cleanDendronConfig, "version", 5);

  // add deprecated paths to legacyPaths
  // so they could be unset if they exist
  legacyPaths.push(...DEPRECATED_PATHS);

  // remove legacy property from config after migration.
  legacyPaths.forEach((legacyPath) => {
    _.unset(cleanDendronConfig, legacyPath);
  });

  // recursively populate missing defaults
  const migratedConfig = _.defaultsDeep(cleanDendronConfig, defaultV5Config);

  return migratedConfig;
};
