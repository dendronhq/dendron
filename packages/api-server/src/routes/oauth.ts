import { DendronError } from "@dendronhq/common-all";
import { Request, Response, Router } from "express";
import { getLogger } from "../core";
import { TokenMethods } from "../modules/oauth";

export enum OauthService {
  GOOGLE = "google",
}

const router = Router();
const oauthHandlers: { [key: string]: TokenMethods } = {};

const L = getLogger();
const ctx = "oauth";

function registerOauthHandler(type: OauthService, handler: TokenMethods) {
  oauthHandlers[type.toString()] = handler;
}

router.get("/getToken", async (req: Request, res: Response) => {
  L.info({ ctx, msg: "get:enter" });

  let resp;

  if (
    typeof req.query.service === "string" &&
    req.query.service in oauthHandlers
  ) {
    resp = await oauthHandlers[req.query.service].getToken({
      code: req.query.code as string,
    });
  } else {
    throw new DendronError({
      message: "unsupported oauth client: " + req.query.service,
    });
  }

  res.send(resp);
});

router.get("/refreshToken", async (req: Request, res: Response) => {
  L.info({ ctx, msg: "get:enter" });
  let resp;

  if (
    typeof req.query.service === "string" &&
    req.query.service in oauthHandlers
  ) {
    resp = await oauthHandlers[req.query.service].refreshToken({
      refreshToken: req.query.refreshToken as string,
    });
  } else {
    throw new DendronError({
      message: "unsupported oauth client: " + req.query.service,
    });
  }

  res.send(resp);
});

export { router as oauthRouter, registerOauthHandler };
