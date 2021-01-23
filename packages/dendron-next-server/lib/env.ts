import _ from "lodash"
import { StageEnv } from "./types";

export function getStage() {
  return process.env.STAGE
}

export function getEnv(key: keyof StageEnv): any {
    const stage = getStage();
    // NOTE: this only works server side, not client side
    const override = _.get(process.env, key)
    return override;
    //return override || ENV[stage][key]
}

// export function dumpEnv(): StageEnv {
//     return ENV[getStage()];
// }

