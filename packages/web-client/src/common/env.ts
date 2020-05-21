import { ConfigKey, config } from "./config";

import { Stage } from "./types";
import _ from "lodash";

export function getStage(): Stage {
  // CRA overrides NODE_ENV to be dev by default
  const { stage, NODE_ENV, STAGE, REACT_APP_STAGE } = process.env;
  let stageOut = REACT_APP_STAGE || stage || STAGE || NODE_ENV;
  // TODO
  if (stageOut === "development") {
    stageOut = "dev";
  }
  if (stageOut === "production") {
    stageOut = "prod";
  }
  return stageOut as Stage;
}

export function getOrThrow<T = any>(obj: T, k: keyof T) {
  const maybeValue = obj[k];
  if (_.isUndefined(maybeValue)) {
    throw `no ${k} in ${obj}`;
  }
  return maybeValue;
}

export function env(name: ConfigKey): any {
  const stage = getStage();
  const val = getOrThrow(config[stage], name);
  const override = process.env[name];
  return override || val;
}
