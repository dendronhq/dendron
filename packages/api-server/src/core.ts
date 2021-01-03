import { createLogger, DLogger, LogLvl } from "@dendronhq/common-server";
import fs from "fs-extra";
import _ from "lodash";

let L: DLogger | undefined;

export function setLogger({
  logPath,
  logLvl,
}: {
  logPath: string;
  logLvl?: LogLvl;
}) {
  const logLevel = logLvl || process.env.LOG_LEVEL || "debug";
  // @ts-ignore
  L = createLogger("dendron.server", logPath, { lvl: logLevel });
  return L;
}

export function getLogger() {
  if (!L) {
    const logPath = process.env.LOG_DST || "stdout";
    L = configureLogger({ logPath });
  }
  return L;
}

export function configureLogger(opts?: { logPath: string; logLvl?: LogLvl }) {
  const { logPath, logLvl } = _.defaults(opts, { logPath: "stdout" });
  if (logPath !== "stdout") {
    if (fs.existsSync(logPath)) {
      fs.moveSync(logPath, `${logPath}.old`, { overwrite: true });
    }
    fs.ensureFileSync(logPath);
  }
  return setLogger({ logPath, logLvl });
}
