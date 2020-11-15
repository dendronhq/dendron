import { createLogger, DLogger } from "@dendronhq/common-server";

let L: DLogger | undefined;

export function setLogger({ logPath }: { logPath: string }) {
  L = createLogger("dendron.server", logPath);
}

export function getLogger() {
  if (!L) {
    L = createLogger("dendron.server");
  }
  return L;
}
