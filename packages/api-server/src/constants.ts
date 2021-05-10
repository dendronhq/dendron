import { DendronError } from "@dendronhq/common-all";

export const LOG_FILE_NAME = "dendron.server.log";
export const LOGGER_NAME = "api-server";

export function getLogPath(): string {
  if (!process.env["LOG_DST"]) {
    throw new DendronError({ message: "log not set" });
  }
  return process.env["LOG_DST"];
}
