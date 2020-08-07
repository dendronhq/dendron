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

const _noteDateDesc = (type: "journal"|"scratch") => (`date format used for ${type} notes`);
const _noteNameDesc = (type: "journal"|"scratch") => (`named used for ${type} notes`);
const _noteAddBehaviorDesc = (type: "journal"|"scratch") => (`strategy for adding new ${type} notes`);
const _noteAddBehaviorEnum = [ "childOfDomain",
"childOfCurrent",
"asOwnDomain"]

export const CONFIG = {
  // --- journals
  DEFAULT_JOURNAL_NAME: {
    key: "dendron.defaultJournalName",
    type: "string",
    default: "journal",
    description: _noteNameDesc("journal"),
  },
  DEFAULT_JOURNAL_DATE_FORMAT: {
    key: "dendron.defaultJournalDateFormat",
    type: "string",
    default: "Y-MM-DD",
    description: _noteDateDesc("journal")
  },
  DEFAULT_JOURNAL_ADD_BEHAVIOR: {
    key: "dendron.defaultJournalAddBehavior",
    default: "childOfDomain",
    description: _noteAddBehaviorDesc("journal");
    enum: _noteAddBehaviorEnum,
  },
  DEFAULT_SCRATCH_NAME: {
    key: "dendron.defaultScratchName",
    type: "string",
    default: "scratch",
    description: _noteNameDesc("scratch"),
  },
  DEFAULT_SCRATCH_DATE_FORMAT: {
    key: "dendron.defaultScratchDateFormat",
    type: "string",
    default: "Y-MM-DD-HHmmss",
    description: _noteDateDesc("scratch")
  },
  DEFAULT_SCRATCH_ADD_BEHAVIOR: {
    key: "dendron.defaultScratchAddBehavior",
    default: "asOwnDomain",
    description: _noteAddBehaviorDesc("scratch"),
    enum: _noteAddBehaviorEnum,
  },
  // --- root dir
  ROOT_DIR: { 
    key: "dendron.rootDir" ,
    type: "string",
    default: false,
    description: "location of dendron workspace"
  },
  // --- other
  NOTESDIR_PATH: { 
    key: "dendron.notesDirPath",
    type: "string",
    desc: "Path to notesdir executable"
  },
  SKIP_PROMPT: { 
    key: "dendron.skipPrompt" ,
    type: "boolean",
    default: false,
    descriptionip: "whether dendron prompts for confirmation for certain actions"
  },
};
