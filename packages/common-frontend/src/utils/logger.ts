import Amplify, { Logger } from "@aws-amplify/core";

export enum LOG_LEVEL {
  DEBUG = "DEBUG",
  INFO = "INFO",
  ERROR = "ERROR",
}

export function createLogger(name: string) {
  return new Logger(name);
}

export function setLogLevel(lvl: LOG_LEVEL) {
  Amplify.Logger.LOG_LEVEL = lvl;
}
