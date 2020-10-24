import { createLogger, DLogger } from "@dendronhq/common-server";

let L: DLogger | undefined;

export function getLogger() {
  if (!L) {
    L = createLogger("dendron.server");
  }
  return L;
}
