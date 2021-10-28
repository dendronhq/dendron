export {
  ReasonPhrases,
  StatusCodes,
  getReasonPhrase,
  getStatusCode,
} from "http-status-codes";
const ROOT_PATH = "/doc/root";

export enum ThemeType {
  LIGHT = "LIGHT",
  DARK = "DARK",
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
  DENDRON_SEED_CONFIG: "seed.yml",
  DENDRON_DELIMETER: "dendron://",
  DENDRON_USER_FILE: ".dendron.user",
  DENDRON_CACHE_FILE: ".dendron.cache.json",
  DENDRON_ID: ".dendron.uuid",
  DENDRON_NO_TELEMETRY: ".dendron.no-telemetry",
  DENDRON_TELEMETRY: ".dendron.telemetry",
  DENDRON_HOOKS_BASE: "hooks",
  DENDRON_LOCAL_SITE_PORT: 8080,
  /**
   * Initial version for first installaion
   */
  DENDRON_INIT_VERSION: "0.0.0",
  /** Default for the `maxNoteLength` config. */
  DENDRON_DEFAULT_MAX_NOTE_LENGTH: 204800,
};

export enum ERROR_STATUS {
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
