export const DENDRON_WS_NAME = "dendron.code-workspace";
export const extensionQualifiedId = `dendron.dendron`;
// export const DENDRON_ENV = {
//     DENDRON_WORKSPACE_FOLDERS: "DENDRON_WORKSPACE_FOLDERS"
// };
export const DENDRON_COMMANDS = {
  LOOKUP: "dendron.lookup",
  INIT_WS: "dendron.initWS",
  CHANGE_WS: "dendron.changeWS",
  DELETE_NODE: "dendron.deleteNode",
  RELOAD_INDEX: "dendron.reloadIndex",
  RELOAD_WS: "dendron.reloadWS",
  CREATE_SCRATCH_NOTE: "dendron.createScratchNote",
  CREATE_JOURNAL_NOTE: "dendron.createJournalNote",
  CREATE_RECORD_NOTE: "dendron.createRecordNote",
  OPEN_LINK: "dendron.openLink",
  IMPORT_POD: "dendron.importPod",
  UPGRADE_SETTINGS: "dendron.upgradeSettings",
  // DEV commands
  RESET_CONFIG: "dendron.dev.resetConfig",
  OPEN_LOGS: "dendron.dev.openLogs",
};

export const DENDRON_CHANNEL_NAME = "Dendron";

export const WORKSPACE_STATE = {
  WS_VERSION: "dendron.wsVersion"
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
export const CONFIG = {
  ROOT_DIR: "rootDir",
  SKIP_PROMPT: "skipPrompt",
};
