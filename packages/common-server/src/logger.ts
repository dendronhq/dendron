// import pino from "pino";

import { env } from "@dendronhq/common-all";
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

function createLogger(
  name?: string,
  dest?: string,
  // TODO: not using pretty option
  opts?: { lvl?: LogLvl; pretty?: boolean }
): pino.Logger {
  const { lvl } = _.defaults(opts, { lvl: "info", pretty: false });
  const level = lvl || env("LOG_LEVEL", { shouldThrow: false }) || "info";
  const nameClean = name || env("LOG_NAME", { shouldThrow: false });
  const logDst = dest || env("LOG_DST", { shouldThrow: false });
  const pinoOpts = { name: nameClean, level };
  if (!logDst || _.isEmpty(logDst) || logDst === "stdout") {
    return pino(pinoOpts);
  } else {
    return pino(pino.destination(logDst)).child(pinoOpts);
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

export { createLogger, pino };

export function logAndThrow(logger: Logger, msg: any): never {
  logger.error(msg);
  throw JSON.stringify(msg);
}
