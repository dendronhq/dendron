export const DENDRON_WS_NAME = "dendron.code-workspace";
export const extensionQualifiedId = `dendron.dendron`;
// export const DENDRON_ENV = {
//     DENDRON_WORKSPACE_FOLDERS: "DENDRON_WORKSPACE_FOLDERS"
// };
export const DENDRON_COMMANDS = {
  LOOKUP: "dendron.lookup",
  LOOKUP_SCHEMA: "dendron.lookupSchema",
  INIT_WS: "dendron.initWS",
  CHANGE_WS: "dendron.changeWS",
  DELETE_NODE: "dendron.deleteNode",
  RELOAD_INDEX: "dendron.reloadIndex",
  RELOAD_WS: "dendron.reloadWS",
  SHOW_HELP: "dendron.showHelp",
  CREATE_SCRATCH_NOTE: "dendron.createScratchNote",
  CREATE_JOURNAL_NOTE: "dendron.createJournalNote",
  // CREATE_RECORD_NOTE: "dendron.createRecordNote",
  OPEN_LINK: "dendron.openLink",
  IMPORT_POD: "dendron.importPod",
  UPGRADE_SETTINGS: "dendron.upgradeSettings",
  // Experimental
  REFACTOR_HIERARCHY: "dendron.refactorHierarchy",
  // DEV commands
  RESET_CONFIG: "dendron.dev.resetConfig",
  OPEN_LOGS: "dendron.dev.openLogs",
  DOCTOR: "dendron.dev.doctor",
  // publish
  BUILD_POD: "dendron.buildPod",
};

export const DENDRON_CHANNEL_NAME = "Dendron";

export const WORKSPACE_STATE = {
  WS_VERSION: "dendron.wsVersion",
};

export const GLOBAL_STATE = {
  VERSION: "dendron.version",
  VERSION_PREV: "dendron.versionPrev",
  /**
   * Set the first time a dendron workspace is activated
   */
  DENDRON_FIRST_WS: "dendron.first_ws",
  DENDRON_FIRST_WS_TUTORIAL_STEP: "dendron.first_ws.tutorial_step",
  /**
   * Extension is being debugged
   */
  VSCODE_DEBUGGING_EXTENSION: "dendron.vscode_debugging_extension",
};

// type ConfigEntry = {
//   key: string;
//   default?: any;
// };
// type ConfigDict = { [k: keyof typeof CONFIG]: ConfigEntry};

export type ConfigKey = keyof typeof CONFIG;

export const CONFIG = {
  DEFAULT_JOURNAL_NAME: {
    key: "dendron.defaultJournalName",
    default: "journal",
  },
  DEFAULT_JOURNAL_DATE_FORMAT: {
    key: "dendron.defaultJournalDateFormat",
    default: "Y-MM-DD",
  },
  DEFAULT_JOURNAL_ADD_BEHAVIOR: {
    key: "dendron.defaultJournalAddBehavior",
    default: "childOfDomain"
  },
  DEFAULT_SCRATCH_NAME: {
    key: "dendron.defaultScratchName",
    default: "scratch",
  },
  DEFAULT_SCRATCH_DATE_FORMAT: {
    key: "dendron.defaultScratchDateFormat",
    default: "Y-MM-DD-HHmmss",
  },
  DEFAULT_SCRATCH_ADD_BEHAVIOR: {
    key: "dendron.defaultScratchAddBehavior",
    default: "asOwnDomain"
  },
  ROOT_DIR: { 
    key: "dendron.rootDir" 
  },
  SKIP_PROMPT: { key: "dendron.skipPrompt" },
};
