import { createLogger } from "@dendronhq/common-server";
import path from "path";

function launch(opts?: { port?: number; logPath?: string }): Promise<number> {
  const ctx = "launch";
  const listenPort = opts?.port || 0;
  const LOG_DST = opts?.logPath
    ? path.join(opts.logPath, "dendron.server.log")
    : "stdout";
  process.env["LOG_DST"] = LOG_DST;
  const L = createLogger("dendron.server");
  return new Promise((resolve) => {
    const appModule = require("./Server").appModule;
    const app = appModule({ logPath: LOG_DST });
    const server = app.listen(listenPort, () => {
      const port = (server.address() as any).port;
      L.info({ ctx, msg: "exit", port, LOG_DST });
      resolve(port);
    });
  });
}
export { launch };
export { appModule } from "./Server";
