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
  // fallback, assume dev
  if (!stageOut) {
    stageOut = "dev";
  }
  return stageOut as Stage;
}

export function getOrThrow<T = any>(
  obj: T,
  k: keyof T,
  opts?: { shouldThrow?: boolean }
) {
  opts = _.defaults(opts, { shouldThrow: true });
  const maybeValue = obj[k];
  if (_.isUndefined(maybeValue) && opts.shouldThrow) {
    throw Error(`no ${k} in ${JSON.stringify(obj)}`);
  }
  return maybeValue;
}

export function env(name: ConfigKey, opts?: { shouldThrow?: boolean }): any {
  const stage = getStage();
  // @ts-ignore: multiple configs
  const val = getOrThrow(config[stage], name, opts);
  const override = process.env[name];
  return override || val;
}
