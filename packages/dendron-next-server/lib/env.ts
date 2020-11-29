import _ from "lodash"
import { ENV } from "./config"
import { StageEnv } from "./types";

export function getStage() {
  return process.env.STAGE
}

export function env(key: keyof StageEnv): any {
    const stage = getStage();
    return ENV[stage][key]
}

export function dump(): StageEnv {
    return ENV[getStage()];
}

