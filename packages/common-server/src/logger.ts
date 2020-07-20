// import pino from "pino";

import { env } from "@dendronhq/common-all";
import path from "path";
import pino from "pino";

export class Logger {
  public name: string;
  public level: string;
  constructor(opts: { name: string; level: string }) {
    this.name = opts.name;
    this.level = opts.level;
  }
  _log(msg: any) {
    let ctx = "";
    if (msg.ctx) {
      ctx = msg.ctx;
    }
    // eslint-disable-next-line no-console
    console.log(this.name, ctx, msg);
  }
  info = (msg: any) => {
    this._log(msg);
  };
  error = (msg: any) => {
    this._log(msg);
  };
}

function createLogger(name?: string) {
  const level = env("LOG_LEVEL", { shouldThrow: false }) || "debug";
  const nameClean = name || env("LOG_NAME");

  const logDst = env("LOG_DST", { shouldThrow: false }) || "stdout";
  if (logDst === "stdout") {
    // TODO: tmp disable pino logging on stdout
    const out = pino({ name: nameClean });
    return out;
  } else {
    return pino(pino.destination(logDst)).child({ name: nameClean, level });
  }
}

export { createLogger };

export function logAndThrow(logger: Logger, msg: any): never {
  logger.error(msg);
  throw JSON.stringify(msg);
}
