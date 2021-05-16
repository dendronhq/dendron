import Amplify, { Logger } from "@aws-amplify/core";

export function createLogger(name: string) {
  return new Logger(name);
}

export function setLogLevel(lvl: "INFO") {
  Amplify.Logger.LOG_LEVEL = lvl;
}
