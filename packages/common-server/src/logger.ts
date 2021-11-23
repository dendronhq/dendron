// import pino from "pino";

import { Disposable, env } from "@dendronhq/common-all";
import _ from "lodash";
import pino from "pino";

export type LogLvl = "debug" | "info" | "error";

export class Logger {
  public name: string;
  public level: string;
  constructor(opts: { name: string; level: string }) {
    this.name = opts.name;
    this.level = opts.level;
  }

  private _log(msg: any) {
    let ctx = "";
    if (msg.ctx) {
      ctx = msg.ctx;
    }
    // eslint-disable-next-line no-console
    console.log(this.name, ctx, msg);
  }
  debug = (msg: any) => {
    this._log(msg);
  };
  info = (msg: any) => {
    this._log(msg);
  };
  error = (msg: any) => {
    this._log(msg);
  };
}

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
): { logger: pino.Logger } & Partial<Disposable> {
  const level = opts?.lvl || env("LOG_LEVEL", { shouldThrow: false }) || "info";
  const nameClean = name || env("LOG_NAME", { shouldThrow: false }) || "logger";
  const logDst = dest || env("LOG_DST", { shouldThrow: false }) || "stdout";
  const pinoOpts = { name: nameClean, level };
  if (logDst === "stdout") {
    return { logger: pino(pinoOpts) };
  } else {
    const destination = pino.destination(logDst);
    return {
      logger: pino(destination).child(pinoOpts),
      dispose: () => destination.destroy(),
    };
  }
}

export type DLogger = {
  name?: string;
  level: any;
  debug: (msg: any) => void;
  info: (msg: any) => void;
  error: (msg: any) => void;
  //fatal: (msg: any) => void;
};

export { createLogger, createDisposableLogger, pino };

export function logAndThrow(logger: Logger, msg: any): never {
  logger.error(msg);
  throw JSON.stringify(msg);
}
