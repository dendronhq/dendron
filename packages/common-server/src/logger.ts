// import pino from "pino";

import { Disposable, env } from "@dendronhq/common-all";
import _ from "lodash";
import pino from "pino";

export type LogLvl = "debug" | "info" | "error";

/** @deprecated Avoid using this function as it may leak file descriptors. Please see createDisposableLogger instead. */
function createLogger(
  name?: string,
  dest?: string,
  // TODO: not using pretty option
  opts?: { lvl?: LogLvl }
): pino.Logger {
  const level = opts?.lvl || env("LOG_LEVEL", { shouldThrow: false }) || "info";
  const nameClean = name || env("LOG_NAME", { shouldThrow: false }) || "logger";
  const logDst = dest || env("LOG_DST", { shouldThrow: false }) || "stdout";
  const pinoOpts = { name: nameClean, level };
  if (logDst === "stdout") {
    return pino(pinoOpts);
  } else {
    return pino(pino.destination(logDst)).child(pinoOpts);
  }
}

/** Create a logger. The logger **must** be disposed after being used if the function returned a dispose callback, otherwise it will leak file descriptors and may lead to crashes. */
function createDisposableLogger(
  name?: string,
  dest?: string,
  // TODO: not using pretty option
  opts?: { lvl?: LogLvl }
): { logger: pino.Logger } & Disposable {
  const level = opts?.lvl || env("LOG_LEVEL", { shouldThrow: false }) || "info";
  const nameClean = name || env("LOG_NAME", { shouldThrow: false }) || "logger";
  const logDst = dest || env("LOG_DST", { shouldThrow: false }) || "stdout";
  const pinoOpts = { name: nameClean, level };
  if (logDst === "stdout") {
    return { logger: pino(pinoOpts), dispose: () => {} };
  } else {
    const destination = pino.destination(logDst);
    return {
      logger: pino(destination).child(pinoOpts),
      dispose: () => destination.destroy(),
    };
  }
}

export { createLogger, createDisposableLogger, pino };

export function logAndThrow(logger: Logger, msg: any): never {
  logger.error(msg);
  throw JSON.stringify(msg);
}
