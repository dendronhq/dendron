import { ENGINE_DELETE_PRESETS } from "./delete";
import { ENGINE_GET_NOTE_BY_PATH_PRESETS } from "./getByPath";
import { ENGINE_INIT_PRESETS } from "./init";
import NOTE_REF from "./note-refs";
import { ENGINE_QUERY_PRESETS } from "./query";
import { ENGINE_RENAME_PRESETS } from "./rename";
import { ENGINE_UPDATE_PRESETS } from "./update";
export { ENGINE_HOOKS } from "./utils";
import { ENGINE_WRITE_PRESETS } from "./write";

export const ENGINE_SERVER = {
  NOTE_REF,
  ENGINE_WRITE_PRESETS,
  ENGINE_INIT_PRESETS,
  ENGINE_UPDATE_PRESETS,
  ENGINE_DELETE_PRESETS,
  ENGINE_GET_NOTE_BY_PATH_PRESETS,
  ENGINE_RENAME_PRESETS,
  ENGINE_QUERY_PRESETS,
};

export const ENGINE_PRESETS = [
  { name: "init", presets: ENGINE_SERVER.ENGINE_INIT_PRESETS },
  { name: "delete", presets: ENGINE_SERVER.ENGINE_DELETE_PRESETS },
  { name: "getByPath", presets: ENGINE_SERVER.ENGINE_GET_NOTE_BY_PATH_PRESETS },
  { name: "query", presets: ENGINE_SERVER.ENGINE_QUERY_PRESETS },
  { name: "rename", presets: ENGINE_SERVER.ENGINE_RENAME_PRESETS },
  { name: "update", presets: ENGINE_SERVER.ENGINE_UPDATE_PRESETS },
  { name: "write", presets: ENGINE_SERVER.ENGINE_WRITE_PRESETS },
];

export { ENGINE_RENAME_PRESETS };
