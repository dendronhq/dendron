
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
    RELOAD_WS: "dendron.reloadWS",
    RESET_CONFIG: "dendron.dev.resetConfig"
};
export const DENDRON_CHANNEL_NAME = "Dendron";
export const GLOBAL_STATE = {
    VERSION: "dendron.version",
    /**
     * Set the first time a dendron workspace is activated
     */
    DENDRON_FIRST_WS: "dendron.first_ws",
    DENDRON_FIRST_WS_TUTORIAL_STEP: "dendron.first_ws.tutorial_step",
    /**
     * Extension is being debugged
     */
    VSCODE_DEBUGGING_EXTENSION: "dendron.vscode_debugging_extension"
};
export const CONFIG = {
    ROOT_DIR: "rootDir",
    SKIP_PROMPT: "skipPrompt"
}