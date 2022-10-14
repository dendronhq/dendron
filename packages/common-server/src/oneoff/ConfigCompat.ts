/* eslint-disable camelcase */
import {
  ConfigUtils,
  DendronConfig,
  DendronDevConfig,
  DendronError,
  DHookDict,
  DVault,
  DVaultSync,
  HierarchyConfig,
  WorkspaceSettings,
} from "@dendronhq/common-all";
import _ from "lodash";

export type MigrationChangeSetStatus = {
  error?: DendronError;
  data: {
    version: string;
    changeName: string;
    status: "ok" | "error";
    dendronConfig: DendronConfig;
    wsConfig?: WorkspaceSettings;
  };
};

class MigrationUtils {
  /**
   * clean up an object recursively with given predicate.
   * @param obj a plain object
   * @param pred predicate to use for recursively omitting
   * @returns obj, with properties omitted by pred
   */
  static deepCleanObjBy(obj: any, pred: Function): any {
    const out = _.omitBy(obj, pred);
    _.keys(out).forEach((key) => {
      if (_.isPlainObject(out[key])) {
        out[key] = MigrationUtils.deepCleanObjBy(out[key], pred);
      }
    });
    return out;
  }

  static getMigrationAnalyticProps({
    data: { changeName, status, version },
  }: MigrationChangeSetStatus) {
    return {
      data: {
        changeName,
        status,
        version,
      },
    };
  }
}

const toBoolean = (value: string): boolean =>
  value.toString().toLowerCase() === "true";

const DEPRECATED_PATHS = [
  "useNunjucks",
  "noLegacyNoteRef",
  "site.siteNotesDir",
  "site.siteRepoDir",
  "site.previewPort",
  "site.useContainers",
  "site.generateChangelog",
  "dev.enableWebUI",
  "workspace.enableHandlebarTemplates",
  "workspace.enableSmartRefs",
  "preview.enableMermaid",
  "enableMermaid",
  "publishing.enableMermaid",
];

type mappedConfigPath = {
  /**
   * legacy config path to target.
   */
  target: string;
  /**
   * How we want to map the config.
   * if "skip", don't map.
   *   use this when it is a namespace that itself has properties.
   * if undefined, identity mapping is assumed (_.identity)
   */
  iteratee?: Function | "skip";
  /**
   * Set to true to mark that legacy path should be preserved.
   */
  preserve?: boolean;
};

/**
 * Used as an function to map a config that has been flipped during migration.
 * @param value boolean value
 * @returns flipped boolean value
 */
const FLIP = (value: boolean): boolean => !value;

export const PATH_MAP = new Map<string, mappedConfigPath>([
  // commands namespace

  // lookup namespace
  ["commands.lookup", { target: "lookup", iteratee: "skip" }],
  // note lookup namespace
  ["commands.lookup.note", { target: "lookup.note", iteratee: "skip" }],
  [
    "commands.lookup.note.selectionMode",
    {
      target: "lookup.note.selectionType",
      iteratee: (value: any) => {
        switch (value) {
          case "selection2link": {
            return "link";
          }
          case "none": {
            return "none";
          }
          case "selectionExtract":
          default: {
            return "extract";
          }
        }
      },
    },
  ],
  [
    "commands.lookup.note.confirmVaultOnCreate",
    { target: "lookupConfirmVaultOnCreate" },
  ],
  ["commands.lookup.note.leaveTrace", { target: "lookup.note.leaveTrace" }],
  [
    "commands.lookup.note.bubbleUpCreateNew",
    { target: "lookupDontBubbleUpCreateNew", iteratee: FLIP },
  ],

  // insertNote namespace
  ["commands.insertNote.initialValue", { target: "defaultInsertHierarchy" }],

  // insertNoteLink namepsace
  ["commands.insertNoteLink", { target: "insertNoteLink", iteratee: "skip" }],
  ["commands.insertNoteLink.aliasMode", { target: "insertNoteLink.aliasMode" }],
  [
    "commands.insertNoteLink.enableMultiSelect",
    { target: "insertNoteLink.multiSelect" },
  ],

  // insertNoteIndex namespace
  ["commands.insertNoteIndex", { target: "insertNoteIndex", iteratee: "skip" }],
  [
    "commands.insertNoteIndex.enableMarker",
    { target: "insertNoteIndex.marker" },
  ],

  // randomNote namespace
  ["commands.randomNote", { target: "randomNote", iteratee: "skip" }],
  ["commands.randomNote.include", { target: "randomNote.include" }],
  ["commands.randomNote.exclude", { target: "randomNote.exclude" }],

  // workspace namespace
  ["workspace.dendronVersion", { target: "dendronVersion" }],
  ["workspace.workspaces", { target: "workspaces" }],
  ["workspace.seeds", { target: "seeds" }],
  ["workspace.vaults", { target: "vaults" }],
  ["workspace.hooks", { target: "hooks" }],

  // journal namespace
  ["workspace.journal", { target: "journal", iteratee: "skip" }],
  ["workspace.journal.dailyDomain", { target: "journal.dailyDomain" }],
  ["workspace.journal.dailyVault", { target: "journal.dailyVault" }],
  ["workspace.journal.name", { target: "journal.name" }],
  ["workspace.journal.dateFormat", { target: "journal.dateFormat" }],
  ["workspace.journal.addBehavior", { target: "journal.addBehavior" }],

  // scratch namespace
  ["workspace.scratch", { target: "scratch", iteratee: "skip" }],
  ["workspace.scratch.name", { target: "scratch.name" }],
  ["workspace.scratch.dateFormat", { target: "scratch.dateFormat" }],
  ["workspace.scratch.addBehavior", { target: "scratch.addBehavior" }],

  // graph namespace
  ["workspace.graph", { target: "graph", iteratee: "skip" }],
  ["workspace.graph.zoomSpeed", { target: "graph.zoomSpeed" }],

  ["workspace.disableTelemetry", { target: "noTelemetry" }],
  [
    "workspace.enableAutoCreateOnDefinition",
    { target: "noAutoCreateOnDefinition", iteratee: FLIP },
  ],
  [
    "workspace.enableXVaultWikiLink",
    { target: "noXVaultWikiLink", iteratee: FLIP },
  ],
  ["workspace.enableRemoteVaultInit", { target: "initializeRemoteVaults" }],
  ["workspace.workspaceVaultSyncMode", { target: "workspaceVaultSync" }],
  ["workspace.enableAutoFoldFrontmatter", { target: "autoFoldFrontmatter" }],
  ["workspace.maxPreviewsCached", { target: "maxPreviewsCached" }],
  ["workspace.maxNoteLength", { target: "maxNoteLength" }],
  ["workspace.feedback", { target: "feedback" }],
  ["workspace.apiEndpoint", { target: "apiEndpoint" }],

  // preview namespace
  ["preview.enableFMTitle", { target: "useFMTitle", preserve: true }],
  [
    "preview.enableHierarchyDisplay",
    { target: "hierarchyDisplay", preserve: true },
  ],
  [
    "preview.hierarchyDisplayTitle",
    { target: "hierarchyDisplayTitle", preserve: true },
  ],
  [
    "preview.enableNoteTitleForLink",
    { target: "useNoteTitleForLink", preserve: true },
  ],
  ["preview.enableMermaid", { target: "mermaid", preserve: true }],
  ["preview.enablePrettyRefs", { target: "usePrettyRefs" }],
  ["preview.enableKatex", { target: "useKatex", preserve: true }],

  // publishing namespace
  ["publishing", { target: "site", iteratee: "skip" }],
  ["publishing.enableFMTitle", { target: "useFMTitle" }],
  ["publishing.enableHierarchyDisplay", { target: "hierarchyDisplay" }],
  ["publishing.hierarchyDisplayTitle", { target: "hierarchyDisplayTitle" }],
  ["publishing.enableNoteTitleForLink", { target: "useNoteTitleForLink" }],
  ["publishing.enableMermaid", { target: "mermaid" }],
  ["publishing.enablePrettyRefs", { target: "site.usePrettyRefs" }],
  ["publishing.enableKatex", { target: "useKatex" }],
  ["publishing.assetsPrefix", { target: "site.assetsPrefix" }],
  ["publishing.copyAssets", { target: "site.copyAssets" }],
  ["publishing.canonicalBaseUrl", { target: "site.canonicalBaseUrl" }],
  ["publishing.customHeaderPath", { target: "site.customHeaderPath" }],
  ["publishing.ga.tracking", { target: "site.ga_tracking" }],
  ["publishing.logoPath", { target: "site.logo" }],
  ["publishing.siteFaviconPath", { target: "site.siteFaviconPath" }],
  ["publishing.siteIndex", { target: "site.siteIndex" }],
  ["publishing.siteHierarchies", { target: "site.siteHierarchies" }],
  ["publishing.enableSiteLastModified", { target: "site.siteLastModified" }],
  ["publishing.siteRootDir", { target: "site.siteRootDir" }],
  ["publishing.siteUrl", { target: "site.siteUrl" }],
  ["publishing.enableFrontmatterTags", { target: "site.showFrontMatterTags" }],
  ["publishing.enableHashesForFMTags", { target: "site.useHashesForFMTags" }],
  [
    "publishing.enableRandomlyColoredTags",
    { target: "site.noRandomlyColoredTags", iteratee: FLIP },
  ],
  [
    "publishing.hierarchy",
    {
      target: "site.config",
      iteratee: (hconfig: HierarchyConfig) => {
        const tmp = {} as HierarchyConfig;
        _.forEach(_.keys(hconfig), (key: string) => {
          _.set(tmp, key, _.omit(_.get(hconfig, key), "noindexByDefault"));
        });
        return tmp;
      },
    },
  ],
  [
    "publishing.duplicateNoteBehavior",
    { target: "site.duplicateNoteBehavior" },
  ],
  ["publishing.writeStubs", { target: "site.writeStubs" }],
  ["publishing.seo.title", { target: "site.title" }],
  ["publishing.seo.description", { target: "site.description" }],
  ["publishing.seo.author", { target: "site.author" }],
  ["publishing.seo.twitter", { target: "site.twitter" }],
  ["publishing.seo.image", { target: "site.image" }],
  ["publishing.github.cname", { target: "site.githubCname" }],
  [
    "publishing.github.enableEditLink",
    { target: "site.gh_edit_link", iteratee: toBoolean },
  ],
  ["publishing.github.editLinkText", { target: "site.gh_edit_link_text" }],
  ["publishing.github.editBranch", { target: "site.gh_edit_branch" }],
  ["publishing.github.editViewMode", { target: "site.gh_edit_view_mode" }],
  ["publishing.github.editRepository", { target: "site.gh_edit_repository" }],
  ["publishing.segmentKey", { target: "site.segmentKey" }],
  ["publishing.cognitoUserPoolId", { target: "site.cognitoUserPoolId" }],
  ["publishing.cognitoClientId", { target: "site.cognitoClientId" }],
  ["publishing.enablePrettyLinks", { target: "site.usePrettyLinks" }],
]);

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
