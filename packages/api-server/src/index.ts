import { LogLvl } from "@dendronhq/common-server";
import express from "express";
import { configureLogger, getLogger } from "./core";

function launch(opts?: {
  port?: number;
  logPath?: string;
  logLevel?: LogLvl;
}): Promise<number> {
  const ctx = "launch";

  const listenPort = opts?.port || 0;
  const LOG_DST = opts?.logPath ? opts.logPath : "stdout";
  configureLogger({ logPath: LOG_DST });

  return new Promise((resolve) => {
    const appModule = require("./Server").appModule;
    const app = appModule({ logPath: LOG_DST });
    const server = app.listen(listenPort, () => {
      const port = (server.address() as any).port;
      getLogger().info({ ctx, msg: "exit", port, LOG_DST, root: __dirname });
      resolve(port);
    });
  });
}

function launchv2(opts?: {
  port?: number;
  logPath?: string;
  logLevel?: LogLvl;
}): Promise<{ port: number; server: any }> {
  const ctx = "launch";

  const listenPort = opts?.port || 0;
  const LOG_DST = opts?.logPath ? opts.logPath : "stdout";
  configureLogger({ logPath: LOG_DST });

  return new Promise((resolve) => {
    const appModule = require("./Server").appModule;
    const app = appModule({ logPath: LOG_DST });
    const server = app.listen(listenPort, () => {
      const port = (server.address() as any).port;
      getLogger().info({ ctx, msg: "exit", port, LOG_DST, root: __dirname });
      resolve({ port, server });
    });
  });
}
export { launch, express, launchv2 };
