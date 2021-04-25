import _ from "lodash";
import { config, ConfigKey } from "./config";
import { Stage } from "./types";

export function getStage(): Stage {
  // CRA overrides NODE_ENV to be dev by default
  // build_STAGE is from 11ty
  const { stage, NODE_ENV, STAGE, REACT_APP_STAGE, BUILD_STAGE } = process.env;
  let stageOut = REACT_APP_STAGE || BUILD_STAGE || stage || STAGE || NODE_ENV;
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

export function setStageIfUndefined(newStage: Stage) {
  const { stage, NODE_ENV, STAGE, REACT_APP_STAGE, BUILD_STAGE } = process.env;
  let stageOut = REACT_APP_STAGE || BUILD_STAGE || stage || STAGE || NODE_ENV;
  if (_.isUndefined(stageOut)) {
    process.env.stage = newStage;
  }
}

export function setEnv(name: ConfigKey, value: any): void {
  process.env[name] = value;
}

export function env(name: ConfigKey, opts?: { shouldThrow?: boolean }): any {
  const override = process.env[name];
  if (override) {
    return override;
  }
  const stage = getStage();
  // @ts-ignore: multiple configs
  return getOrThrow((config || {})[stage] || {}, name, opts);
}
