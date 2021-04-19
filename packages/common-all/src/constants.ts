const ROOT_PATH = "/doc/root";

export const CONSTANTS = {
  ROOT_PATH,
  ALL_QUERY: "**/*",
  DENDRON_SERVER_PORT: ".dendron.port",
  DENDRON_WS_META: ".dendron.ws",
  DENDRON_CONFIG_FILE: "dendron.yml",
  DENDRON_DELIMETER: "dendron://",
  DENDRON_USER_FILE: ".dendron.user",
};

export const ENGINE_ERROR_CODES = {
  NODE_EXISTS: "node_exists",
  NO_SCHEMA_FOUND: "no_schema_found",
  NO_ROOT_SCHEMA_FOUND: "no_root_schema_found",
  MISSING_SCHEMA: "missing_schema",
  NO_ROOT_NOTE_FOUND: "no_root_note_found",
  BAD_PARSE_FOR_NOTE: "bad_parse_for_note",
  BAD_PARSE_FOR_SCHEMA: "bad_parse_for_schema",
  NO_PARENT_FOR_NOTE: "no_parent_for_note",
  CANT_DELETE_ROOT: "no_delete_root_node",
  ENGINE_NOT_SET: "no_engine_set",
};

export enum ERROR_CODES {
  MINOR,
}

export enum RESERVED_KEYS {
  GIT_NOTE_PATH = "gitNotePath",
  GIT_NO_LINK = "gitNoLink",
}
