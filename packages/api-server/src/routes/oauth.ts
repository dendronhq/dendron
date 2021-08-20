import { DendronError } from "@dendronhq/common-all";
import { Request, Response, Router } from "express";
import { getLogger } from "../core";
import { GoogleAuthController } from "../modules/oauth";

const router = Router();
const L = getLogger();
const ctx = "oauth";

enum OauthSevice {
  GOOGLE = "google",
}

router.get("/getToken", async (req: Request, res: Response) => {
  L.info({ ctx, msg: "get:enter" });

  let resp;
  switch (req.query.service) {
    case OauthSevice.GOOGLE:
      resp = await new GoogleAuthController().getToken({
        code: req.query.code as string,
      });
      break;
    default:
      throw new DendronError({ message: "error getting access token" });
  }

  res.send(resp);
});

router.get("/refreshToken", async (req: Request, res: Response) => {
  L.info({ ctx, msg: "get:enter" });
  let resp;
  switch (req.query.service) {
    case OauthSevice.GOOGLE:
      resp = await new GoogleAuthController().refreshToken({
        refreshToken: req.query.refreshToken as string,
      });
      break;
    default:
      throw new DendronError({ message: "error refreshing token" });
  }

  res.send(resp);
});

export { router as oauthRouter };
