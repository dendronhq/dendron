import { DendronError } from "@dendronhq/common-all";

export const LOG_FILE_NAME = "dendron.server.log";

export function getLogPath(): string {
  if (!process.env["LOG_DST"]) {
    throw new DendronError({ msg: "log not set" });
  }
  return process.env["LOG_DST"];
}
