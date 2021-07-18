import { findInParent } from "@dendronhq/common-server";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs-extra";
import { BAD_REQUEST } from "http-status-codes";
import morgan from "morgan";
import path from "path";
import querystring from "querystring";
import { getLogger } from "./core";
import { baseRouter } from "./routes";

export function appModule({
  logPath,
  nextServerUrl,
  nextStaticRoot,
}: {
  logPath: string;
  nextServerUrl?: string;
  nextStaticRoot?: string;
}) {
  const ctx = "appModule:start";
  const logger = getLogger()
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "500mb" }));
  app.use(express.urlencoded({ extended: true }));
  if (logPath !== "stdout") {
    const accessLogStream = fs.createWriteStream(logPath, { flags: "a" });
    app.use(
      morgan(
        ":method :url :status :response-time ms - :res[content-length] - :req[content-length]",
        {
          stream: accessLogStream,
        }
      )
    );
  }

  logger.info({ ctx, dirPath: __dirname });
  const staticDir = path.join(__dirname, "static");
  app.use(express.static(staticDir));

  if (nextStaticRoot) {
    logger.info({ ctx, msg: "nextStaticRoot:add", nextStaticRoot });
    app.use(express.static(nextStaticRoot));
  }

  if (nextServerUrl) {
    logger.info({ ctx, msg: "adding nextServerUrl", nextServerUrl });
    app.use("/vscode", (req, res) => {
      const redirectUrl =
        nextServerUrl +
        "/vscode" +
        req.path.replace(/.html/, "") +
        "?" +
        querystring.stringify(req.query as any);
      logger.info({ ctx, msg: "redirecting", redirectUrl });
      return res.redirect(redirectUrl);
    });
  }

  app.get("/health", async (_req: Request, res: Response) => {
    return res.json({ ok: 1 });
  });

  app.get("/version", async (_req: Request, res: Response) => {
    const pkg = findInParent(__dirname, "package.json");
    if (!pkg) {
      throw Error("no pkg found");
    }
    const version = fs.readJSONSync(path.join(pkg, "package.json")).version;
    return res.json({ version });
  });

  app.use("/api", baseRouter);
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  });
  return app;
}
