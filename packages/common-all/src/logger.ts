import { env } from "./env";
import pino from "pino";

function createLogger(name?: string) {
  let level = env("LOG_LEVEL", { shouldThrow: false }) || "debug";
  let nameClean = name || env("LOG_NAME");
  return pino({ name: nameClean, level });
}

export { createLogger };

export function logAndThrow(logger: pino.Logger, msg: any): never {
  logger.error(msg);
  throw JSON.stringify(msg);
}
