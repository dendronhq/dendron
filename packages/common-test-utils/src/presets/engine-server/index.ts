import { ENGINE_CONFIG_PRESETS } from "./config";
import { ENGINE_DELETE_PRESETS } from "./delete";
import { ENGINE_GET_NOTE_BY_PATH_PRESETS } from "./getByPath";
import { ENGINE_INFO_PRESETS } from "./info";
import { ENGINE_INIT_PRESETS } from "./init";
import NOTE_REF from "./note-refs";
import { ENGINE_QUERY_PRESETS } from "./query";
import { ENGINE_RENAME_PRESETS } from "./rename";
import { ENGINE_UPDATE_PRESETS } from "./update";
import { ENGINE_WRITE_PRESETS, ENGINE_WRITE_PRESETS_MULTI } from "./write";
export { ENGINE_HOOKS, ENGINE_HOOKS_BASE, ENGINE_HOOKS_MULTI } from "./utils";
export { ENGINE_RENAME_PRESETS };
export { ENGINE_QUERY_PRESETS };
export { ENGINE_WRITE_PRESETS };
export { ENGINE_CONFIG_PRESETS };

export const ENGINE_SERVER = {
  NOTE_REF,
  ENGINE_WRITE_PRESETS,
  ENGINE_INIT_PRESETS,
  ENGINE_UPDATE_PRESETS,
  ENGINE_DELETE_PRESETS,
  ENGINE_INFO_PRESETS,
  ENGINE_GET_NOTE_BY_PATH_PRESETS,
  ENGINE_RENAME_PRESETS,
  ENGINE_QUERY_PRESETS,
};

export const ENGINE_PRESETS = [
  { name: "init", presets: ENGINE_SERVER.ENGINE_INIT_PRESETS },
  { name: "delete", presets: ENGINE_SERVER.ENGINE_DELETE_PRESETS },
  { name: "getByPath", presets: ENGINE_SERVER.ENGINE_GET_NOTE_BY_PATH_PRESETS },
  { name: "info", presets: ENGINE_SERVER.ENGINE_INFO_PRESETS },
  { name: "query", presets: ENGINE_SERVER.ENGINE_QUERY_PRESETS },
  { name: "rename", presets: ENGINE_SERVER.ENGINE_RENAME_PRESETS },
  { name: "update", presets: ENGINE_SERVER.ENGINE_UPDATE_PRESETS },
  { name: "write", presets: ENGINE_SERVER.ENGINE_WRITE_PRESETS },
];

export const ENGINE_PRESETS_MULTI = [
  { name: "init", presets: ENGINE_SERVER.ENGINE_INIT_PRESETS },
  { name: "delete", presets: ENGINE_SERVER.ENGINE_DELETE_PRESETS },
  { name: "getByPath", presets: ENGINE_SERVER.ENGINE_GET_NOTE_BY_PATH_PRESETS },
  { name: "query", presets: ENGINE_SERVER.ENGINE_QUERY_PRESETS },
  { name: "rename", presets: ENGINE_SERVER.ENGINE_RENAME_PRESETS },
  { name: "update", presets: ENGINE_SERVER.ENGINE_UPDATE_PRESETS },
  { name: "write", presets: ENGINE_WRITE_PRESETS_MULTI },
];
