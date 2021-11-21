import { LOG_LEVEL } from "@dendronhq/common-frontend";
import { NextRouter } from "next/router";
import { NoteRouterQuery } from "./types";

export function getNoteRouterQuery(router: NextRouter) {
  return router.query as Partial<NoteRouterQuery>;
}

export function getLogLevel(): LOG_LEVEL {
  const logLevel = process.env.LOG_LEVEL || LOG_LEVEL.INFO;
  if (!Object.values(LOG_LEVEL).includes(logLevel as LOG_LEVEL)) {
    return LOG_LEVEL.INFO;
  }
  return logLevel as LOG_LEVEL;
}
