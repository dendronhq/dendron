import { createLogger, DLogger } from "@dendronhq/common-server";
import fs from "fs-extra";

let L: DLogger | undefined;

export function setLogger({ logPath }: { logPath: string }) {
  const logLevel = process.env.LOG_LEVEL || "debug";
  // @ts-ignore
  L = createLogger("dendron.server", logPath, { lvl: logLevel });
  return L;
}

export function getLogger() {
  if (!L) {
    const logPath = process.env.LOG_DST || "stdout";
    L = configureLogger(logPath);
  }
  return L;
}

export function configureLogger(logPath?: string) {
  if (!logPath) {
    logPath = "stdout";
  }
  if (logPath !== "stdout") {
    if (fs.existsSync(logPath)) {
      fs.moveSync(logPath, `${logPath}.old`, { overwrite: true });
    }
    fs.ensureFileSync(logPath);
  }
  return setLogger({ logPath });
}
