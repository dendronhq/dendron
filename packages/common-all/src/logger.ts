import _ from "lodash";
import { env } from "./env";
import pino from "pino";

const Logger = (name?: string) => {
  let level = env("LOG_LEVEL", { shouldThrow: false }) || "info";
  let nameClean = name || env("LOG_NAME");
  return pino({ name: nameClean, level });
};
export { Logger };

export function logAndThrow(logger: pino.Logger, msg: any): never {
  logger.error(msg);
  throw JSON.stringify(msg);
}
