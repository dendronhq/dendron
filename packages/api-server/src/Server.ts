import { findInParent } from "@dendronhq/common-server";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs-extra";
import { BAD_REQUEST } from "http-status-codes";
import morgan from "morgan";
import path from "path";
import { baseRouter } from "./routes";
import cors from "cors";

export function appModule({ logPath }: { logPath: string }) {
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

  const staticDir = path.join(__dirname, "static");
  app.use(express.static(staticDir));

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
