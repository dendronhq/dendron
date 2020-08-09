export const DENDRON_WS_NAME = "dendron.code-workspace";
export const extensionQualifiedId = `dendron.dendron`;
// export const DENDRON_ENV = {
//     DENDRON_WORKSPACE_FOLDERS: "DENDRON_WORKSPACE_FOLDERS"
// };

const CMD_PREFIX = "Dendron:";
export const DENDRON_COMMANDS = {
  // --- Notes
  CREATE_JOURNAL_NOTE: {
    key: "dendron.createJournalNote",
    title: `${CMD_PREFIX} Create Journal Note`,
  },
  CREATE_SCRATCH_NOTE: {
    key: "dendron.createScratchNote",
    title: `${CMD_PREFIX} Create Scratch Note`,
  },
  COPY_NOTE_LINK: {
    key: "dendron.copyNoteLink",
    title: `${CMD_PREFIX} Copy Note Link`,
  },
  DELETE_NODE: {
    key: "dendron.deleteNode",
    title: `${CMD_PREFIX} Delete Node`,
  },
  LOOKUP: {
    key: "dendron.lookup",
    title: `${CMD_PREFIX} Lookup`,
  },
  LOOKUP_SCHEMA: {
    key: "dendron.lookupSchema",
    title: `${CMD_PREFIX} Lookup Schema`,
  },
  RENAME_NOTE: {
    key: "dendron.renameNote",
    title: `${CMD_PREFIX} Rename Note`,
  },
  // --- Workspace
  INIT_WS: {
    key: "dendron.initWS",
    title: `${CMD_PREFIX} Initialize Workspace`,
  },
  CHANGE_WS: {
    key: "dendron.changeWS",
    title: `${CMD_PREFIX} Change Workspace`,
  },
  RELOAD_INDEX: {
    key: "dendron.reloadIndex",
    title: `${CMD_PREFIX} Reload Index`,
  },
  // --- Pods
  BUILD_POD: { key: "dendron.buildPod", title: `${CMD_PREFIX} Build Pod` },
  IMPORT_POD: { key: "dendron.importPod", title: `${CMD_PREFIX} Import Pod` },
  // --- Misc
  OPEN_LINK: { key: "dendron.openLink", title: `${CMD_PREFIX} Open Link` },
  UPGRADE_SETTINGS: {
    key: "dendron.upgradeSettings",
    title: `${CMD_PREFIX} Upgrade Settings`,
  },
  SHOW_HELP: { key: "dendron.showHelp", title: `${CMD_PREFIX} Show Help` },
  // REFACTOR_HIERARCHY: {
  //   key: "dendron.refactorHierarchy",
  //   title: `${CMD_PREFIX} Refactor Hierarchy`,
  // },
  // --- Dev
  DOCTOR: { key: "dendron.dev.doctor", title: `${CMD_PREFIX}Dev: Doctor` },
  RESET_CONFIG: {
    key: "dendron.dev.resetConfig",
    title: `${CMD_PREFIX}Dev: Reset Config`,
  },
  OPEN_LOGS: {
    key: "dendron.dev.openLogs",
    title: `${CMD_PREFIX}Dev: Open Logs`,
  },
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

const _noteDateDesc = (type: "journal" | "scratch") =>
  `date format used for ${type} notes`;
const _noteNameDesc = (type: "journal" | "scratch") =>
  `named used for ${type} notes`;
const _noteAddBehaviorDesc = (type: "journal" | "scratch") =>
  `strategy for adding new ${type} notes`;
const _noteAddBehaviorEnum = ["childOfDomain", "childOfCurrent", "asOwnDomain"];

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
    description: _noteDateDesc("journal"),
  },
  DEFAULT_JOURNAL_ADD_BEHAVIOR: {
    key: "dendron.defaultJournalAddBehavior",
    default: "childOfDomain",
    description: _noteAddBehaviorDesc("journal"),
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
    description: _noteDateDesc("scratch"),
  },
  DEFAULT_SCRATCH_ADD_BEHAVIOR: {
    key: "dendron.defaultScratchAddBehavior",
    default: "asOwnDomain",
    description: _noteAddBehaviorDesc("scratch"),
    enum: _noteAddBehaviorEnum,
  },
  // --- root dir
  ROOT_DIR: {
    key: "dendron.rootDir",
    type: "string",
    default: false,
    description: "location of dendron workspace",
  },
  // --- other
  NOTESDIR_PATH: {
    key: "dendron.notesDirPath",
    type: "string",
    desc: "Path to notesdir executable",
  },
  SKIP_PROMPT: {
    key: "dendron.skipPrompt",
    type: "boolean",
    default: false,
    descriptionip:
      "whether dendron prompts for confirmation for certain actions",
  },
};
