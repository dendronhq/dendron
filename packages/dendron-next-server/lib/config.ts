import { DEngineClientV2 } from "@dendronhq/common-all";
import { getEnv } from "./env";
import { CONFIG_KEY, StageEnv } from "./types";



type API_PATH_KEY = {[key in keyof DEngineClientV2]: string}

// @ts-ignore
const API_PATH_MAP: API_PATH_KEY = {
  getConfig: "/api/config/get",
  writeConfig: "/api/config/write"
}

const API_REMOTE_PATH_MAP = {
  gardenAll: "/api/garden/al"
}

type API_REMOTE_KEY =  keyof typeof API_REMOTE_PATH_MAP;;

export function api(key: keyof DEngineClientV2): string {
  const port = process.env.ENGINE_ENDPOINT_PORT;
  const suffix = port ? `http://localhost:${port}`: ``;
  return suffix + API_PATH_MAP[key]
}

export function apiRemote(key: API_REMOTE_KEY): string {
  const port = process.env.ENGINE_ENDPOINT_PORT;
  const url = getEnv(CONFIG_KEY.REMOTE_API_ENDPOINT);
  const suffix = url;
  return suffix + API_REMOTE_PATH_MAP[key]
}