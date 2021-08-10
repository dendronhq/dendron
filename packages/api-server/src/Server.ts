import { getStage } from "@dendronhq/common-all";
import { findInParent } from "@dendronhq/common-server";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import fs from "fs-extra";
import { BAD_REQUEST } from "http-status-codes";
import morgan from "morgan";
import path from "path";
import querystring from "querystring";
import { getLogger } from "./core";
import { GoogleAuthController } from "./modules/oauth";
import { baseRouter } from "./routes";
import {
  oauthRouter,
  OauthService,
  registerOauthHandler,
} from "./routes/oauth";
import * as Sentry from "@sentry/node";
import * as Tracing from "@sentry/tracing";

export function appModule({
  logPath,
  nextServerUrl,
  nextStaticRoot,
  googleOauthClientId,
  googleOauthClientSecret,
}: {
  logPath: string;
  nextServerUrl?: string;
  nextStaticRoot?: string;
  googleOauthClientId?: string;
  googleOauthClientSecret: string;
}) {
  const ctx = "appModule:start";
  const logger = getLogger();
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

  logger.info(googleOauthClientId);
  logger.info({ ctx, dirPath: __dirname });
  const staticDir = path.join(__dirname, "static");
  app.use(express.static(staticDir));

  // Setup Sentry:

  Sentry.init({
    dsn: "https://bc206b31a30a4595a2efb31e8cc0c04e@o949501.ingest.sentry.io/5898219",
    integrations: [
      // enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // enable Express.js middleware tracing
      new Tracing.Integrations.Express({ app }),
    ],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0,
  });

  // RequestHandler creates a separate execution context using domains, so that every
  // transaction/span/breadcrumb is attached to its own Hub instance
  app.use(Sentry.Handlers.requestHandler());
  // TracingHandler creates a trace for every incoming request
  app.use(Sentry.Handlers.tracingHandler());

  // for dev environment, get preview from next-server in monorepo
  if (getStage() !== "prod") {
    // packages/api-server/lib/Server.ts
    const devStaticRoot = path.join(
      __dirname,
      "..",
      "..",
      "dendron-next-server",
      "out"
    );
    logger.info({ ctx, msg: "devStaticRoot:add", devStaticRoot });
    app.use(express.static(devStaticRoot));
  }
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

  registerOauthHandler(
    OauthService.GOOGLE,
    new GoogleAuthController(googleOauthClientId!, googleOauthClientSecret)
  );
  baseRouter.use("/oauth", oauthRouter);

  app.use("/api", baseRouter);

  app.get("/debug-sentry", (req, res) => {
    throw new Error("My first Sentry error!");
  });

  // The error handler must be before any other error middleware and after all controllers
  app.use(Sentry.Handlers.errorHandler());

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.message, err);
    return res.status(BAD_REQUEST).json({
      error: err.message,
    });
  });
  return app;
}
