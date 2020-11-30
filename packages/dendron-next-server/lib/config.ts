import { DEngineClientV2 } from "@dendronhq/common-all";
import { getEnv } from "./env";
import { StageEnv } from "./types";


export const ENV: {[key: string]: StageEnv} = {
  dev: {
  },
  prod: {
  }
}

type API_PATH_KEY = {[key in keyof DEngineClientV2]: string}

// @ts-ignore
const API_PATH_MAP: API_PATH_KEY = {
  getConfig: "/api/config/get",
  writeConfig: "/api/config/write"
}

export function api(key: keyof DEngineClientV2): string {
  const port = process.env.ENGINE_ENDPOINT_PORT;
  const suffix = port ? `http://localhost:${port}`: ``;
  return suffix + API_PATH_MAP[key]
}