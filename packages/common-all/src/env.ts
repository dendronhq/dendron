import _ from "lodash";
import { config, ConfigKey } from "./config";
import { Stage } from "./types";

let overrideStage: string | undefined;

/** Get the env variables we are interested in.
 *
 * This workaround is needed because nextjs replaces these with static values at
 * **build time**. Inside the browser, there's no `process.env`. And nextjs can
 * only replace them if they are explicit like this, it doesn't work if we do
 * `const {stage} = process.env;`.
 */
function getProcEnvs() {
  const _env = process?.env || ({} as any);
  const stage = _env["stage"];
  const NODE_ENV = _env["NODE_ENV"];
  const STAGE = _env["STAGE"];
  const REACT_APP_STAGE = _env["REACT_APP_STAGE"];
  const BUILD_STAGE = _env["BUILD_STAGE"];
  const GITHUB_ACTIONS = _env["GITHUB_ACTIONS"];
  return {
    stage,
    NODE_ENV,
    STAGE,
    REACT_APP_STAGE,
    BUILD_STAGE,
    GITHUB_ACTIONS,
  };
}

export function getStage(): Stage {
  // CRA overrides NODE_ENV to be dev by default
  // build_STAGE is from 11ty
  const { stage, NODE_ENV, STAGE, REACT_APP_STAGE, BUILD_STAGE } =
    getProcEnvs();
  let stageOut =
    REACT_APP_STAGE ||
    BUILD_STAGE ||
    stage ||
    STAGE ||
    NODE_ENV ||
    process.env.NODE_ENV || // Webpack will do a direct text substitution on this value. See https://webpack.js.org/configuration/mode/
    overrideStage;
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
    throw Error(`no ${String(k)} in ${JSON.stringify(obj)}`);
  }
  return maybeValue;
}

export function setStageIfUndefined(newStage: Stage) {
  const { stage, NODE_ENV, STAGE, REACT_APP_STAGE, BUILD_STAGE } =
    getProcEnvs();
  const stageOut = REACT_APP_STAGE || BUILD_STAGE || stage || STAGE || NODE_ENV;
  if (_.isUndefined(stageOut)) {
    try {
      process.env.stage = newStage;
    } catch {
      // This might fail in the browser where process.env doesn't exist
      overrideStage = newStage;
    }
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

/**
 * Various utilities that are not categorized
 */
export class RuntimeUtils {
  static isRunningInTestOrCI() {
    return this.isRunningInsideCI() || this.isRunningInsideTest();
  }
  /**
   * Check if running inside test context
   */
  static isRunningInsideTest(): boolean {
    return getStage() === "test";
  }

  /**
   * Check if process is running inside a CI
   */
  static isRunningInsideCI(): boolean {
    if (_.get(getProcEnvs(), "GITHUB_ACTIONS")) {
      return true;
    }
    return false;
  }
}
