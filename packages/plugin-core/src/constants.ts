import {
  DendronTreeViewKey,
  isWebViewEntry,
  TREE_VIEWS,
} from "@dendronhq/common-all";
import { BacklinkSortOrder, CodeConfigKeys } from "./types";

export const extensionQualifiedId = `dendron.dendron`;
export const DEFAULT_LEGACY_VAULT_NAME = "vault";

export enum DendronContext {
  PLUGIN_ACTIVE = "dendron:pluginActive",
  WEB_UI_ENABLED = "dendron:webUIEnabled",
  DEV_MODE = "dendron:devMode",
  HAS_LEGACY_PREVIEW = "dendron:hasLegacyPreview",
  HAS_CUSTOM_MARKDOWN_VIEW = "hasCustomMarkdownPreview",
  NOTE_LOOK_UP_ACTIVE = "dendron:noteLookupActive",
  SHOULD_SHOW_LOOKUP_VIEW = "dendron:shouldShowLookupView",
  BACKLINKS_SORT_ORDER = "dendron:backlinksSortOrder",
  ENABLE_EXPORT_PODV2 = "dendron:enableExportPodV2",
}

const treeViewConfig2VSCodeEntry = (id: DendronTreeViewKey) => {
  const entry = TREE_VIEWS[id];
  const out: {
    id: string;
    name: string;
    contextualTitle: string;
    type?: "webview";
  } = {
    id,
    name: entry.label,
    contextualTitle: entry.label,
  };
  if (isWebViewEntry(entry)) {
    out.type = "webview";
  }
  return out;
};

export const DENDRON_VIEWS = [
  {
    ...treeViewConfig2VSCodeEntry(DendronTreeViewKey.SAMPLE_VIEW),
    when: DendronContext.DEV_MODE,
    where: "explorer",
  },
  {
    ...treeViewConfig2VSCodeEntry(DendronTreeViewKey.CALENDAR_VIEW),
    where: "explorer",
    when: DendronContext.PLUGIN_ACTIVE,
  },
  {
    ...treeViewConfig2VSCodeEntry(DendronTreeViewKey.TREE_VIEW),
    when: `${DendronContext.PLUGIN_ACTIVE} && !${DendronContext.WEB_UI_ENABLED}`,
    where: "explorer",
    icon: "media/icons/dendron-vscode.svg",
  },
  {
    ...treeViewConfig2VSCodeEntry(DendronTreeViewKey.TREE_VIEW_V2),
    when: `${DendronContext.PLUGIN_ACTIVE} && ${DendronContext.WEB_UI_ENABLED}`,
    where: "explorer",
    icon: "media/icons/dendron-vscode.svg",
  },
  {
    ...treeViewConfig2VSCodeEntry(DendronTreeViewKey.LOOKUP_VIEW),
    when: `${DendronContext.PLUGIN_ACTIVE} && ${DendronContext.NOTE_LOOK_UP_ACTIVE} && ${DendronContext.SHOULD_SHOW_LOOKUP_VIEW}`,
    where: "explorer",
  },
  {
    id: DendronTreeViewKey.BACKLINKS,
    name: "Backlinks",
    when: DendronContext.PLUGIN_ACTIVE,
    where: "explorer",
  },
];

type KeyBinding = {
  key?: string;
  mac?: string;
  windows?: string;
  when?: string;
  args?: any;
};

type ConfigEntry = {
  key: string;
  description: string;
  type: "string" | "boolean" | "number";
  default?: any;
  enum?: string[];
  scope?: CommandEntry;
};

type Entry = {
  name: string;
  description: string;
  data: any;
};

type CommandEntry = {
  key: string;
  title: string;
  keybindings?: KeyBinding;
  icon?: string;
  // this will be used in `commandPalette` contribution point.
  when?: string;
  // this will be used in `commands` contribution point.
  enablement?: string;
};

const CMD_PREFIX = "Dendron:";
export const ICONS = {
  STUB: "gist-new",
  SCHEMA: "repo",
  LINK_CANDIDATE: "debug-disconnect",
  WIKILINK: "link",
};
export const DENDRON_WORKSPACE_FILE = "dendron.code-workspace";

export const DENDRON_REMOTE_VAULTS: Entry[] = [
  {
    name: "dendron",
    description: "dendron.so notes",
    data: "https://github.com/dendronhq/dendron-site.git",
  },
  {
    name: "aws",
    description: "aws notes",
    data: "https://github.com/dendronhq/dendron-aws-vault.git",
  },
  {
    name: "tldr",
    description: "cli tld",
    data: "https://github.com/kevinslin/seed-tldr.git",
  },
  {
    name: "xkcd",
    description: "all xkcd comics",
    data: "https://github.com/kevinslin/seed-xkcd.git",
  },
];

type CommandPaletteEntry = {
  command: string;
  when?: string;
};

// TODO: fomarlize
export const DENDRON_MENUS = {
  commandPalette: [] as CommandPaletteEntry[],
  "view/title": [
    /**
     * Sort orders are round-robined, if we add more orders and/or change ordering
     * of sort order THEN make sure to update the labels of the command since the labels
     * display the current backlink ordering that is being used.
     * */
    {
      command: "dendron.backlinks.sortByLastUpdated",
      when: `view == dendron.backlinks && ${DendronContext.BACKLINKS_SORT_ORDER} == ${BacklinkSortOrder.PathNames}`,
      group: "navigation@1",
    },
    {
      command: "dendron.backlinks.sortByPathNames",
      when: `view == dendron.backlinks && ${DendronContext.BACKLINKS_SORT_ORDER} == ${BacklinkSortOrder.LastUpdated}`,
      group: "navigation@1",
    },
    {
      command: "dendron.backlinks.expandAll",
      when: "view == dendron.backlinks",
      group: "navigation@2",
    },
  ],
  "explorer/context": [
    {
      when: "explorerResourceIsFolder && dendron:pluginActive && workspaceFolderCount > 1",
      command: "dendron.vaultAdd",
      group: "2_workspace",
    },
    {
      when: "explorerResourceIsFolder && dendron:pluginActive",
      command: "dendron.vaultRemove",
      group: "2_workspace",
    },
    {
      // [[Command Enablement / When Clause Gotchas|dendron://dendron.docs/pkg.plugin-core.t.commands.ops#command-enablement--when-clause-gotchas]]
      when: "resourceExtname == .md && dendron:pluginActive || resourceExtname == .yml && dendron:pluginActive",
      command: "dendron.deleteNode",
      group: "2_workspace",
    },
    {
      when: "resourceExtname == .md && dendron:pluginActive",
      command: "dendron.moveNote",
      group: "2_workspace",
    },
    {
      command: "dendron.showPreview",
      // when is the same as the built-in preview, plus pluginActive
      when: "resourceLangId == markdown && dendron:pluginActive",
      group: "navigation",
    },
  ],
  "editor/context": [
    {
      when: "resourceExtname == .md && dendron:pluginActive",
      command: "dendron.copyNoteLink",
      group: "2_workspace",
    },
  ],
  "editor/title": [
    {
      command: "dendron.showPreview",
      // when is the same as the built-in preview, plus pluginActive
      when: "editorLangId == markdown && !notebookEditorFocused && dendron:pluginActive",
      group: "navigation",
    },
  ],
  "editor/title/context": [
    {
      command: "dendron.showPreview",
      when: "resourceLangId == markdown && dendron:pluginActive",
      group: "1_open",
    },
  ],
};

export const DENDRON_COMMANDS: { [key: string]: CommandEntry } = {
  // ---
  BACKLINK_SORT_BY_LAST_UPDATED: {
    key: "dendron.backlinks.sortByLastUpdated",
    title: "Sort by last updated (currently sorted by path names)",
    icon: "$(list-ordered)",
  },
  BACKLINK_SORT_BY_PATH_NAMES: {
    key: "dendron.backlinks.sortByPathNames",
    title: "Sort by path names (currently sorted by last updated)",
    icon: "$(list-ordered)",
  },
  BACKLINK_EXPAND_ALL: {
    key: "dendron.backlinks.expandAll",
    title: "Expand All",
    icon: "$(expand-all)",
  },
  // --- Notes
  BROWSE_NOTE: {
    key: "dendron.browseNote",
    // no prefix, we don't want to show this command
    title: `${CMD_PREFIX} Browse Note`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  CONTRIBUTE: {
    key: "dendron.contributeToCause",
    // no prefix, we don't want to show this command
    title: `${CMD_PREFIX} Contribute`,
  },
  GOTO_NOTE: {
    key: "dendron.gotoNote",
    // no prefix, we don't want to show this command
    title: `${CMD_PREFIX} Go to Note`,
    when: DendronContext.PLUGIN_ACTIVE,
    keybindings: {
      key: "ctrl+enter",
      when: "editorFocus",
    },
  },
  CREATE_SCHEMA_FROM_HIERARCHY: {
    key: "dendron.createSchemaFromHierarchy",
    title: `${CMD_PREFIX} Create Schema From Note Hierarchy`,
    keybindings: {
      when: `editorFocus && ${DendronContext.PLUGIN_ACTIVE}`,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  CREATE_DAILY_JOURNAL_NOTE: {
    key: "dendron.createDailyJournalNote",
    title: `${CMD_PREFIX} Create Daily Journal Note`,
    keybindings: {
      key: "ctrl+shift+i",
      mac: "cmd+shift+i",
      when: DendronContext.PLUGIN_ACTIVE,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  COPY_NOTE_LINK: {
    key: "dendron.copyNoteLink",
    title: `${CMD_PREFIX} Copy Note Link`,
    keybindings: {
      key: "ctrl+shift+c",
      mac: "cmd+shift+c",
      when: `editorFocus && ${DendronContext.PLUGIN_ACTIVE}`,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  COPY_NOTE_REF: {
    key: "dendron.copyNoteRef",
    title: `${CMD_PREFIX} Copy Note Ref`,
    keybindings: {
      key: "ctrl+shift+r",
      mac: "cmd+shift+r",
      when: `editorFocus && ${DendronContext.PLUGIN_ACTIVE}`,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  DELETE_NODE: {
    key: "dendron.deleteNode",
    title: `${CMD_PREFIX} Delete Node`,
    keybindings: {
      key: "ctrl+shift+d",
      mac: "cmd+shift+d",
      when: DendronContext.PLUGIN_ACTIVE,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  INSERT_NOTE: {
    key: "dendron.insertNote",
    title: `${CMD_PREFIX} Insert Note`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  INSERT_NOTE_LINK: {
    key: "dendron.insertNoteLink",
    title: `${CMD_PREFIX} Insert Note Link`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  INSERT_NOTE_INDEX: {
    key: "dendron.insertNoteIndex",
    title: `${CMD_PREFIX} Insert Note Index`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  MOVE_NOTE: {
    key: "dendron.moveNote",
    title: `${CMD_PREFIX} Move Note`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  RANDOM_NOTE: {
    key: "dendron.randomNote",
    title: `${CMD_PREFIX} Random Note`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  RENAME_NOTE: {
    key: "dendron.renameNote",
    title: `${CMD_PREFIX} Rename Note`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  RENAME_HEADER: {
    key: "dendron.renameHeader",
    title: `${CMD_PREFIX} Rename Header`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  MOVE_HEADER: {
    key: "dendron.moveHeader",
    title: `${CMD_PREFIX} Move Header`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  CONVERT_CANDIDATE_LINK: {
    key: "dendron.convertCandidateLink",
    title: `${CMD_PREFIX} Convert Candidate Link`,
    when: "false",
  },
  CONVERT_LINK: {
    key: "dendron.convertLink",
    title: `${CMD_PREFIX} Convert Link`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  LOOKUP_NOTE: {
    key: "dendron.lookupNote",
    title: `${CMD_PREFIX} Lookup Note`,
    keybindings: {
      mac: "cmd+L",
      key: "ctrl+l",
      when: DendronContext.PLUGIN_ACTIVE,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },

  // This command will only apply when the note look up quick pick is open
  // which is taken care by the DendronContext.NOTE_LOOK_UP_ACTIVE
  //
  // It will also NOT activate when the focus is in editor using `!editorFocus`
  //
  // However, when it comes to user navigating to side panels its quite imperfect.
  // We do have some protection against Tab interception by using the `!view`
  // (most side panels set the view variable Eg. "view": "dendron.backlinks").
  // But it is possible for user to tab into empty side panel which does not
  // have a `view` context set, at that point if user still has look up open and
  // presses tab, Tab will get intercepted by note auto complete.
  //
  // Ideally there would be a trigger event when quick pick goes in focus/focuses out
  // but not able to find such hook.
  LOOKUP_NOTE_AUTO_COMPLETE: {
    key: "dendron.lookupNoteAutoComplete",

    /** This command will NOT show up within the command palette
     *  since its disabled within package.json in contributes.menus.commandPalette */
    title: `${CMD_PREFIX} hidden`,
    keybindings: {
      key: "Tab",
      when: `${DendronContext.PLUGIN_ACTIVE} && ${DendronContext.NOTE_LOOK_UP_ACTIVE} && !editorFocus && !view`,
    },
    when: `${DendronContext.PLUGIN_ACTIVE} && ${DendronContext.NOTE_LOOK_UP_ACTIVE} && !editorFocus && !view`,
  },
  CREATE_JOURNAL: {
    key: "dendron.createJournalNote",
    title: `${CMD_PREFIX} Create Journal Note`,
    keybindings: {
      key: "ctrl+shift+j",
      mac: "cmd+shift+j",
      args: {
        noteType: "journal",
      },
      when: DendronContext.PLUGIN_ACTIVE,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  CREATE_SCRATCH: {
    key: "dendron.createScratchNote",
    title: `${CMD_PREFIX} Create Scratch Note`,
    keybindings: {
      key: "ctrl+shift+s",
      mac: "cmd+shift+s",
      when: DendronContext.PLUGIN_ACTIVE,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  LOOKUP_SCHEMA: {
    key: "dendron.lookupSchema",
    title: `${CMD_PREFIX} Lookup Schema`,
    keybindings: {
      mac: "cmd+shift+L",
      key: "ctrl+shift+l",
      when: DendronContext.PLUGIN_ACTIVE,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  RELOAD_INDEX: {
    key: "dendron.reloadIndex",
    title: `${CMD_PREFIX} Reload Index`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  TASK_CREATE: {
    key: "dendron.createTask",
    title: `${CMD_PREFIX} Create Task Note`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  // --- Hierarchies
  ARCHIVE_HIERARCHY: {
    key: "dendron.archiveHierarchy",
    title: `${CMD_PREFIX} Archive Hierarchy`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  REFACTOR_HIERARCHY: {
    key: "dendron.refactorHierarchy",
    title: `${CMD_PREFIX} Refactor Hierarchy`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  GO_UP_HIERARCHY: {
    key: "dendron.goUpHierarchy",
    title: `${CMD_PREFIX} Go Up`,
    keybindings: {
      mac: "cmd+shift+up",
      key: "ctrl+shift+up",
      when: `editorFocus && ${DendronContext.PLUGIN_ACTIVE}`,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  GO_NEXT_HIERARCHY: {
    key: "dendron.goNextHierarchy",
    title: `${CMD_PREFIX} Go Next Sibling`,
    keybindings: {
      key: "ctrl+shift+]",
      when: `editorFocus && ${DendronContext.PLUGIN_ACTIVE}`,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  GO_PREV_HIERARCHY: {
    key: "dendron.goPrevHierarchy",
    title: `${CMD_PREFIX} Go Previous Sibling`,
    keybindings: {
      key: "ctrl+shift+[",
      when: `editorFocus && ${DendronContext.PLUGIN_ACTIVE}`,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  GO_DOWN_HIERARCHY: {
    key: "dendron.goDownHierarchy",
    title: `${CMD_PREFIX} Go Down`,
    keybindings: {
      mac: "cmd+shift+down",
      key: "ctrl+shift+down",
      when: `editorFocus && ${DendronContext.PLUGIN_ACTIVE}`,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  // --- Workspace
  ADD_AND_COMMIT: {
    key: "dendron.addAndCommit",
    title: `${CMD_PREFIX} Workspace: Add and Commit`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  SYNC: {
    key: "dendron.sync",
    title: `${CMD_PREFIX} Workspace: Sync`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  VAULT_ADD: {
    key: "dendron.vaultAdd",
    title: `${CMD_PREFIX} Vault Add`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  VAULT_REMOVE: {
    key: "dendron.vaultRemove",
    title: `${CMD_PREFIX} Vault Remove`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  VAULT_CONVERT: {
    key: "dendron.vaultConvert",
    title: `${CMD_PREFIX} Vault Convert`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  INIT_WS: {
    key: "dendron.initWS",
    title: `${CMD_PREFIX} Initialize Workspace`,
  },
  CHANGE_WS: {
    key: "dendron.changeWS",
    title: `${CMD_PREFIX} Change Workspace`,
  },
  UPGRADE_SETTINGS: {
    key: "dendron.upgradeSettings",
    title: `${CMD_PREFIX} Upgrade Settings`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  // --- Pods
  CONFIGURE_POD: {
    key: "dendron.configurePod",
    title: `${CMD_PREFIX} Configure Pod`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  CONFIGURE_SERVICE_CONNECTION: {
    key: "dendron.configureServiceConnection",
    title: `${CMD_PREFIX} Configure Service Connection`,
    enablement: `${DendronContext.PLUGIN_ACTIVE} && ${DendronContext.ENABLE_EXPORT_PODV2}`,
  },
  CONFIGURE_EXPORT_POD_V2: {
    key: "dendron.configureExportPodV2",
    title: `${CMD_PREFIX} Configure Export Pod V2`,
    enablement: `${DendronContext.PLUGIN_ACTIVE} && ${DendronContext.ENABLE_EXPORT_PODV2}`,
  },
  IMPORT_POD: {
    key: "dendron.importPod",
    title: `${CMD_PREFIX} Import Pod`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  EXPORT_POD: {
    key: "dendron.exportPod",
    title: `${CMD_PREFIX} Export Pod`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  EXPORT_POD_V2: {
    key: "dendron.exportPodv2",
    title: `${CMD_PREFIX} Export Pod V2`,
    enablement: `${DendronContext.PLUGIN_ACTIVE} && ${DendronContext.ENABLE_EXPORT_PODV2}`,
  },
  PUBLISH_POD: {
    key: "dendron.publishPod",
    title: `${CMD_PREFIX} Publish Pod`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  SNAPSHOT_VAULT: {
    key: "dendron.snapshotVault",
    title: `${CMD_PREFIX} Snapshot Vault`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  RESTORE_VAULT: {
    key: "dendron.restoreVault",
    title: `${CMD_PREFIX} Restore Vault`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  COPY_NOTE_URL: {
    key: "dendron.copyNoteURL",
    title: `${CMD_PREFIX} Copy Note URL`,
    keybindings: {
      mac: "cmd+shift+u",
      windows: "ctrl+shift+u",
      when: `editorFocus && ${DendronContext.PLUGIN_ACTIVE}`,
    },
    when: DendronContext.PLUGIN_ACTIVE,
  },
  // --- Hooks
  CREATE_HOOK: {
    key: "dendron.createHook",
    title: `${CMD_PREFIX} Hook Create`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  DELETE_HOOK: {
    key: "dendron.deleteHook",
    title: `${CMD_PREFIX} Hook Delete`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  REGISTER_NOTE_TRAIT: {
    key: "dendron.registerNoteTrait",
    title: `${CMD_PREFIX} Register Note Trait`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  CREATE_USER_DEFINED_NOTE: {
    key: "dendron.createNoteWithTraits",
    title: `${CMD_PREFIX} Create Note with Custom Traits`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  // --- Publishing
  PUBLISH_EXPORT: {
    key: "dendron.publishExport",
    title: `${CMD_PREFIX} Publish Export`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  PUBLISH_DEV: {
    key: "dendron.publishDev",
    title: `${CMD_PREFIX} Publish Dev`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  // --- Accounts
  SIGNUP: {
    key: "dendron.signUp",
    title: `${CMD_PREFIX} Sign Up`,
  },
  SIGNIN: {
    key: "dendron.signIn",
    title: `${CMD_PREFIX} Sign In`,
  },
  // --- Misc
  ENABLE_TELEMETRY: {
    key: "dendron.enableTelemetry",
    title: `${CMD_PREFIX} Enable Telemetry`,
  },
  DISABLE_TELEMETRY: {
    key: "dendron.disableTelemetry",
    title: `${CMD_PREFIX} Disable Telemetry`,
  },
  OPEN_LINK: {
    key: "dendron.openLink",
    title: `${CMD_PREFIX} Open Link`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  PASTE_LINK: {
    key: "dendron.pasteLink",
    title: `${CMD_PREFIX} Paste Link`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  SHOW_HELP: {
    key: "dendron.showHelp",
    title: `${CMD_PREFIX} Show Help`,
  },
  SHOW_NOTE_GRAPH: {
    key: "dendron.showNoteGraph",
    title: `${CMD_PREFIX} Show Note Graph`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  SHOW_SCHEMA_GRAPH: {
    key: "dendron.showSchemaGraph",
    title: `${CMD_PREFIX} Show Schema Graph`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  SHOW_LEGACY_PREVIEW: {
    key: "dendron.showLegacyPreview",
    title: `${CMD_PREFIX} Show Preview (legacy)`,
    keybindings: {
      windows: "windows+ctrl+p",
      mac: "cmd+ctrl+p",
      when: "dendron:pluginActive && dendron:hasLegacyPreview",
    },
    when: "dendron:pluginActive && dendron:hasLegacyPreview",
  },
  SHOW_PREVIEW: {
    key: "dendron.showPreview",
    title: `${CMD_PREFIX} Show Preview`,
    icon: `$(open-preview)`,
    keybindings: {
      windows: "windows+ctrl+p",
      mac: "cmd+ctrl+p",
      when: "dendron:pluginActive",
    },
    when: "dendron:pluginActive",
  },
  PASTE_FILE: {
    key: "dendron.pasteFile",
    title: `${CMD_PREFIX} Paste File`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  // -- Workbench
  CONFIGURE_RAW: {
    key: "dendron.configureRaw",
    title: `${CMD_PREFIX} Configure (yaml)`,
    when: DendronContext.PLUGIN_ACTIVE,
  },

  CONFIGURE_UI: {
    key: "dendron.configureUI",
    title: `${CMD_PREFIX} Configure`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  CONFIGURE_GRAPH_STYLES: {
    key: "dendron.configureGraphStyle",
    title: `${CMD_PREFIX} Configure Graph Style (css)`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  //-- Seeds
  SEED_ADD: {
    key: "dendron.seedAdd",
    title: `${CMD_PREFIX} Add Seed to Workspace`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  SEED_REMOVE: {
    key: "dendron.seedRemove",
    title: `${CMD_PREFIX} Remove Seed from Workspace`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  SEED_BROWSE: {
    key: "dendron.seedBrowse",
    title: `${CMD_PREFIX} Browse the Seed Registry`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  // --- Dev
  DOCTOR: {
    key: "dendron.dev.doctor",
    title: `${CMD_PREFIX} Doctor`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  DUMP_STATE: {
    key: "dendron.dev.dumpState",
    title: `${CMD_PREFIX} Dump State`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  DEV_TRIGGER: {
    key: "dendron.dev.devTrigger",
    title: `${CMD_PREFIX}Dev: Dev Trigger`,
    when: DendronContext.DEV_MODE,
  },
  RESET_CONFIG: {
    key: "dendron.dev.resetConfig",
    title: `${CMD_PREFIX}Dev: Reset Config`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  RUN_MIGRATION: {
    key: "dendron.dev.runMigration",
    title: `${CMD_PREFIX}Dev: Run Migration`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  OPEN_LOGS: {
    key: "dendron.dev.openLogs",
    title: `${CMD_PREFIX}Dev: Open Logs`,
  },
  DEV_DIAGNOSTICS_REPORT: {
    key: "dendron.diagnosticsReport",
    title: `${CMD_PREFIX}Dev: Diagnostics Report`,
    when: DendronContext.PLUGIN_ACTIVE,
  },
  LAUNCH_TUTORIAL: {
    key: "dendron.launchTutorial",
    title: `${CMD_PREFIX} Launch Tutorial`,
  },
};

export const DENDRON_CHANNEL_NAME = "Dendron";

export const WORKSPACE_STATE = {
  VERSION: "dendron.wsVersion",
};

export enum GLOBAL_STATE {
  VERSION = "dendron.version",
  /**
   * Context that can be used on extension activation to trigger special behavior.
   */
  WORKSPACE_ACTIVATION_CONTEXT = "dendron.workspace_activation_context",
  /**
   * Extension is being debugged
   */
  VSCODE_DEBUGGING_EXTENSION = "dendron.vscode_debugging_extension",
  /**
   * Most Recently Imported Doc
   */
  MRUDocs = "MRUDocs",
  /**
   * Checks if initial survey was prompted and submitted.
   */
  INITIAL_SURVEY_SUBMITTED = "dendron.initial_survey_submitted",
  /**
   * Checks if lapsed user survey was submitted.
   */
  LAPSED_USER_SURVEY_SUBMITTED = "dendron.lapsed_user_survey_submitted",
  /**
   * Chekcs if inactive user survey was submitted.
   */
  INACTIVE_USER_SURVEY_SUBMITTED = "dendron.inactive_user_survey_submitted",
}

export enum WORKSPACE_ACTIVATION_CONTEXT {
  // UNSET - Indicates this is the first Workspace Launch
  "NORMAL", // Normal Launch; No Special Behavior
  "TUTORIAL", // Launch the Tutorial
  "SEED_BROWSER", // Open with Seed Browser Webview
}

// export const GLOBAL_STATE = {
//   VERSION: "dendron.version",
//   /**
//    * Set the first time a dendron workspace is activated
//    */
//   DENDRON_FIRST_WS: "dendron.first_ws",
//   DENDRON_FIRST_WS_TUTORIAL_STEP: "dendron.first_ws.tutorial_step",
//   /**
//    * Extension is being debugged
//    */
//   VSCODE_DEBUGGING_EXTENSION: "dendron.vscode_debugging_extension",
// };

// type ConfigEntry = {
//   key: string;
//   default?: any;
// };
// type ConfigDict = { [k: keyof typeof CONFIG]: ConfigEntry};

export type ConfigKey = keyof typeof CONFIG;

/**

const _noteDateDesc = (type: "journal" | "scratch") =>
  `date format used for ${type} notes`;
const _noteNameDesc = (type: "journal" | "scratch") =>
  `name used for ${type} notes`;
const _noteAddBehaviorDesc = (type: "journal" | "scratch") =>
  `strategy for adding new ${type} notes`;

*/

export const _noteAddBehaviorEnum = [
  "childOfDomain",
  "childOfDomainNamespace",
  "childOfCurrent",
  "asOwnDomain",
];

export const CONFIG: { [key: string]: ConfigEntry } = {
  // --- journals
  DAILY_JOURNAL_DOMAIN: {
    key: "dendron.dailyJournalDomain",
    type: "string",
    default: "daily",
    description: "DEPRECATED. Use journal settings in dendron.yml",
  },
  DEFAULT_JOURNAL_NAME: {
    key: "dendron.defaultJournalName",
    type: "string",
    default: "journal",
    description: "DEPRECATED. Use journal settings in dendron.yml",
  },
  DEFAULT_JOURNAL_DATE_FORMAT: {
    key: "dendron.defaultJournalDateFormat",
    type: "string",
    default: "y.MM.dd",
    description: "DEPRECATED. Use journal settings in dendron.yml",
  },
  DEFAULT_JOURNAL_ADD_BEHAVIOR: {
    key: "dendron.defaultJournalAddBehavior",
    default: "childOfDomain",
    type: "string",
    description: "DEPRECATED. Use journal settings in dendron.yml",
    enum: _noteAddBehaviorEnum,
  },
  DEFAULT_SCRATCH_NAME: {
    key: "dendron.defaultScratchName",
    type: "string",
    default: "scratch",
    description: "DEPRECATED. Use scratch settings in dendron.yml",
  },
  DEFAULT_SCRATCH_DATE_FORMAT: {
    key: "dendron.defaultScratchDateFormat",
    type: "string",
    default: "y.MM.dd.HHmmss",
    description: "DEPRECATED. Use scratch settings in dendron.yml",
  },
  DEFAULT_SCRATCH_ADD_BEHAVIOR: {
    key: "dendron.defaultScratchAddBehavior",
    default: "asOwnDomain",
    type: "string",
    description: "DEPRECATED. Use scratch settings in dendron.yml",
    enum: _noteAddBehaviorEnum,
  },
  COPY_NOTE_URL_ROOT: {
    key: "dendron.copyNoteUrlRoot",
    type: "string",
    description: "override root url when getting note url",
  },
  LINK_SELECT_AUTO_TITLE_BEHAVIOR: {
    key: "dendron.linkSelectAutoTitleBehavior",
    type: "string",
    description: "Control title behavior when using selection2link with lookup",
    enum: ["none", "slug"],
    default: "slug",
  },
  DEFAULT_LOOKUP_CREATE_BEHAVIOR: {
    key: "dendron.defaultLookupCreateBehavior",
    default: "selectionExtract",
    type: "string",
    description:
      "when creating a new note with selected text, define behavior for selected text",
    enum: ["selection2link", "selectionExtract"],
  },
  // --- timestamp decoration
  DEFAULT_TIMESTAMP_DECORATION_FORMAT: {
    key: CodeConfigKeys.DEFAULT_TIMESTAMP_DECORATION_FORMAT,
    default: "DATETIME_MED",
    type: "string",
    description: "Decide how human readable timestamp decoration is displayed",
    enum: [
      "DATETIME_FULL",
      "DATETIME_FULL_WITH_SECONDS",
      "DATETIME_HUGE",
      "DATETIME_HUGE_WITH_SECONDS",
      "DATETIME_MED",
      "DATETIME_MED_WITH_SECONDS",
      "DATETIME_SHORT",
      "DATETIME_SHORT_WITH_SECONDS",
      "DATE_FULL",
      "DATE_HUGE",
      "DATE_MED",
      "DATE_MED_WITH_WEEKDAY",
      "DATE_SHORT",
      "TIME_24_SIMPLE",
      "TIME_24_WITH_LONG_OFFSET",
      "TIME_24_WITH_SECONDS",
      "TIME_24_WITH_SHORT_OFFSET",
      "TIME_SIMPLE",
      "TIME_WITH_LONG_OFFSET",
      "TIME_WITH_SECONDS",
      "TIME_WITH_SHORT_OFFSET",
    ],
  },
  // --- root dir
  ROOT_DIR: {
    key: "dendron.rootDir",
    type: "string",
    default: "",
    description: "location of dendron workspace",
  },
  DENDRON_DIR: {
    key: "dendron.dendronDir",
    type: "string",
    default: "",
    description: "DEPRECATED. Use journal settings in dendron.yml",
  },
  // --- other
  LOG_LEVEL: {
    key: "dendron.logLevel",
    type: "string",
    default: "info",
    description: "control verbosity of dendron logs",
    enum: ["debug", "info", "error"],
  },
  LSP_LOG_LVL: {
    key: "dendron.trace.server",
    enum: ["off", "messages", "verbose"],
    type: "string",
    default: "messages",
    description: "LSP log level",
  },
  SERVER_PORT: {
    key: "dendron.serverPort",
    type: "number",
    description:
      "port for server. If not set, will be randomly generated at startup.",
  },
  WATCH_FOR_NATIVE_WS: {
    key: "dendron.watchForNativeWorkspace",
    type: "boolean",
    default: false,
    description:
      "When enabled, Dendron will watch non-Dendron workspaces to detect when one is created, and will automatically initialize itself. Otherwise, you may need to reload VSCode after creating a native workspace.",
  },
};

export const gdocRequiredScopes = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive",
];

export const Oauth2Pods = ["dendron.gdoc"];

export const INCOMPATIBLE_EXTENSIONS = [
  "yzhang.markdown-all-in-one",
  "fantasy.markdown-all-in-one-for-web",
  "foam.foam-vscode",
  "brianibbotson.add-double-bracket-notation-to-selection",
  "ianjsikes.md-graph",
  "thomaskoppelaar.markdown-wiki-links-preview",
  "svsool.markdown-memo",
  "kortina.vscode-markdown-notes",
  "maxedmands.vscode-zettel-markdown-notes",
  "tchayen.markdown-links",
];
