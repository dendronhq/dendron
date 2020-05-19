import { ConfigKey, config } from "./config";

import { Stage } from "./types";
import _ from "lodash";

export function getStage(): Stage {
  const { stage, NODE_ENV, STAGE, REACT_APP_STAGE } = process.env;
  const stageOut = REACT_APP_STAGE || stage || STAGE || NODE_ENV;
  // TODO
  return stageOut as Stage;
}

export function env(name: ConfigKey): any {
  const stage = getStage();
  const val = config[stage][name];
  const override = process.env[name];
  return override || val;
}

export function getOrThrow<T = any>(obj: T, k: keyof T) {
  const maybeValue = obj[k];
  if (_.isUndefined(maybeValue)) {
    throw `no ${k} in ${obj}`;
  }
  return maybeValue;
}
