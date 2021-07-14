import { APIUtils, DEngineClient } from "@dendronhq/common-all";
import { getEnv } from "./env";
import { CONFIG_KEY } from "./types";



type API_PATH_KEY = {[key in keyof DEngineClient]: string}

// @ts-ignore
const API_PATH_MAP: API_PATH_KEY = {
  getConfig: "/api/config/get",
  writeConfig: "/api/config/write"
}

const API_REMOTE_PATH_MAP = {
  gardenAll: "/api/garden/al"
}

type API_REMOTE_KEY =  keyof typeof API_REMOTE_PATH_MAP;;

export function api(key: keyof DEngineClient): string {
  const port = process.env.ENGINE_ENDPOINT_PORT;
  const suffix = port ? APIUtils.getLocalEndpoint(parseInt(port)): ``;
  return suffix + API_PATH_MAP[key]
}

export function apiRemote(key: API_REMOTE_KEY): string {
  const url = getEnv(CONFIG_KEY.REMOTE_API_ENDPOINT);
  const suffix = url;
  return suffix + API_REMOTE_PATH_MAP[key]
}