export * from "./frontend";
export * from "./views";
export * from "./lookup";
export * from "./configs/compat";

export {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} from "http-status-codes";
const ROOT_PATH = "/doc/root";

export enum ThemeType {
  LIGHT = "light",
  DARK = "dark",
}

export enum ThemeTarget {
  PRISM = "PRISM",
}

export const CONSTANTS = {
  ROOT_PATH,
  ALL_QUERY: "**/*",
  DENDRON_WS_NAME: "dendron.code-workspace",
  DENDRON_SERVER_PORT: ".dendron.port",
  DENDRON_WS_META: ".dendron.ws",
  DENDRON_CONFIG_FILE: "dendron.yml",
  DENDRON_LOCAL_CONFIG_FILE: "dendronrc.yml",
  DENDRON_SEED_CONFIG: "seed.yml",
  DENDRON_DELIMETER: "dendron://",
  DENDRON_USER_FILE: ".dendron.user",
  DENDRON_CACHE_FILE: ".dendron.cache.json",
  DENDRON_ID: ".dendron.uuid",
  DENDRON_NO_TELEMETRY: ".dendron.no-telemetry",
  DENDRON_TELEMETRY: ".dendron.telemetry",
  DENDRON_HOOKS_BASE: "hooks",
  DENDRON_USER_NOTE_TRAITS_BASE: "noteTraits",
  DENDRON_LOCAL_SITE_PORT: 8080,
  /**
   * Initial version for first installaion
   */
  DENDRON_INIT_VERSION: "0.0.0",
  /** Default for the `maxNoteLength` config. */
  DENDRON_DEFAULT_MAX_NOTE_LENGTH: 204800,
  /** The file containing the custom theme CSS. Located at the workspace root. */
  CUSTOM_THEME_CSS: "custom.css",
};

export const FOLDERS = {
  /** The folder where the vault dependencies are stored. */
  DEPENDENCIES: "dependencies",
  /** The subfolder of {@link FOLDERS.DEPENDENCIES} where local vaults are stored. */
  LOCAL_DEPENDENCY: "localhost",
  /** The folder where the notes of the vault are stored. */
  NOTES: "notes",
  /** The folder where the assets are stored, this will be under {@link FOLDERS.NOTES}. */
  ASSETS: "assets",
  /** The system-wide folder where Dendron stores metadata and other system-wide files. */
  DENDRON_SYSTEM_ROOT: ".dendron",
  /** The folder where telemetry payloads that will be sent during next run are temporarily saved. Under {@link FOLDERS.DENDRON_SYSTEM_ROOT}. */
  SAVED_TELEMETRY: "saved-telemetry",
};

export enum ERROR_STATUS {
  BACKUP_FAILED = "backup_failed",
  NODE_EXISTS = "node_exists",
  NO_SCHEMA_FOUND = "no_schema_found",
  NO_ROOT_SCHEMA_FOUND = "no_root_schema_found",
  MISSING_SCHEMA = "missing_schema",
  NO_ROOT_NOTE_FOUND = "no_root_note_found",
  BAD_PARSE_FOR_SCHEMA = "bad_parse_for_schema",
  NO_PARENT_FOR_NOTE = "no_parent_for_note",
  CANT_DELETE_ROOT = "no_delete_root_node",
  // --- 400, client errors
  // Bucket
  BAD_PARSE_FOR_NOTE = "bad_parse_for_note",
  ENGINE_NOT_SET = "no_engine_set",
  // 401
  NOT_AUTHORIZED = "not_authorized",
  // 402
  DOES_NOT_EXIST = "does_not_exist_error",
  INVALID_CONFIG = "invalid_config",
  INVALID_STATE = "invalid_state",
  // --- 500
  UNKNOWN = "unknown",

  // storage layer errors
  CONTENT_NOT_FOUND = "content_not_found",
  WRITE_FAILED = "write_failed",
  DELETE_FAILED = "delete_failed",
  RENAME_FAILED = "rename_failed",
}

export enum USER_MESSAGES {
  UNKNOWN = "unknown",
}

/**
 * Labels whether error is recoverable or not
 */
export enum ERROR_SEVERITY {
  MINOR = "minor",
  FATAL = "fatal",
}

export enum RESERVED_KEYS {
  GIT_NOTE_PATH = "gitNotePath",
  GIT_NO_LINK = "gitNoLink",
}

export const TAGS_HIERARCHY_BASE = "tags";
/** Notes under this hierarchy are considered tags, for example `${TAGS_HIERARCHY}foo` is a tag note. */
export const TAGS_HIERARCHY = `${TAGS_HIERARCHY_BASE}.`;

export const USERS_HIERARCHY_BASE = "user";
/** Notes under this hierarchy are considered users, for example `${USERS_HIERARCHY}Hamilton` is a user note. */
export const USERS_HIERARCHY = `${USERS_HIERARCHY_BASE}.`;

export type VaultRemoteSource = "local" | "remote";

export enum DENDRON_EMOJIS {
  SEEDLING = "🌱",
  OKAY = "✅",
  NOT_OKAY = "❎",
}

export enum DENDRON_VSCODE_CONFIG_KEYS {
  ENABLE_SELF_CONTAINED_VAULTS_WORKSPACE = "dendron.enableSelfContainedVaultWorkspace",
}

/**
 * Keys to a global state store. Global here means across a single user's
 * different access platforms.
 */
export enum GLOBAL_STATE_KEYS {
  ANONYMOUS_ID = "telemetry.anonymousId",
}
