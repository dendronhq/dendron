import { DendronError, getStage, StatusCodes } from "@dendronhq/common-all";
import { findInParent, SegmentClient } from "@dendronhq/common-server";
import { RewriteFrames } from "@sentry/integrations";
import * as Sentry from "@sentry/node";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import fs from "fs-extra";
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

  const environment = getStage();

  // TODO: Consolidate with Sentry Init logic in _extension once webpack issues are diagnosed.
  const dsn =
    environment === "prod"
      ? "https://bc206b31a30a4595a2efb31e8cc0c04e@o949501.ingest.sentry.io/5898219"
      : undefined;

  // Respect user's telemetry settings for error reporting too.
  const enabled = !SegmentClient.instance().hasOptedOut;

  Sentry.init({
    dsn,
    defaultIntegrations: false,
    tracesSampleRate: 1.0,
    enabled,
    environment,
    attachStacktrace: true,
    beforeSend(event, hint) {
      const error = hint?.originalException;
      if (error && error instanceof DendronError) {
        event.extra = {
          name: error.name,
          message: error.message,
          payload: error.payload,
          severity: error.severity?.toString(),
          code: error.code,
          status: error.status,
          // isComposite: error.isComposite,
        };
      }
      return event;
    },
    integrations: [
      new RewriteFrames({
        prefix: "app:///dist/",
      }),
    ],
  });

  // Re-use the id for error reporting too:
  Sentry.setUser({ id: SegmentClient.instance().anonymousId });

  app.use(Sentry.Handlers.requestHandler() as express.RequestHandler);

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
    debugger;
    return res.json({ ok: 1 });
  });

  app.get(
    "/version",
    asyncHandler(async (_req: Request, res: Response) => {
      const pkg = findInParent(__dirname, "package.json");
      if (!pkg) {
        throw Error("no pkg found");
      }
      const version = fs.readJSONSync(path.join(pkg, "package.json")).version;
      return res.json({ version });
    })
  );

  registerOauthHandler(
    OauthService.GOOGLE,
    new GoogleAuthController(googleOauthClientId!, googleOauthClientSecret)
  );
  baseRouter.use("/oauth", oauthRouter);

  app.use("/api", baseRouter);

  // The error handler must be before any other error middleware and after all controllers
  // app.use(Sentry.Handlers.errorHandler() as express.ErrorRequestHandler);
  app.use(
    Sentry.Handlers.errorHandler({
      shouldHandleError() {
        // Upload all exceptions
        return true;
      },
    }) as express.ErrorRequestHandler
  );

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.message, err);
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: JSON.stringify(err),
    });
  });

  return app;
}
