import { DEngineClientV2 } from "@dendronhq/common-all";
import { StageEnv } from "./types";


export const ENV: {[key: string]: StageEnv} = {
  dev: {
  },
  prod: {
  }
}

export type CONFIG_KEY = keyof typeof CONFIG;

export const CONFIG = {
  DEBUG: false,
  DEBUG_PREFIX: "http://localhost:3005"
};

type API_PATH_KEY = {[key in keyof DEngineClientV2]: string}

// @ts-ignore
const API_PATH_MAP: API_PATH_KEY = {
  getConfig: "/api/config/get",
  writeConfig: "/api/config/write"
}

export function api(key: keyof DEngineClientV2): string {
  let suffix = CONFIG.DEBUG ? CONFIG.DEBUG_PREFIX : "";
  return suffix + API_PATH_MAP[key]
}