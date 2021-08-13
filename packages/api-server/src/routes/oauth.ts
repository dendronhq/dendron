import { Request, Response, Router } from "express";
import { getLogger } from "../core";
import { AuthController } from "../modules/oauth";

const router = Router();
const L = getLogger();
const ctx = "oauth";

router.get("/getToken", async (req: Request, res: Response) => {
  L.info({ ctx, msg: "get:enter" });
  const resp = await AuthController.instance().getToken(
    req.query.code as string
  );
  L.info({ ctx, msg: "get:ext", resp });
  res.send(resp);
});

router.get("/refreshToken", async (req: Request, res: Response) => {
  L.info({ ctx, msg: "get:enter" });
  const resp = await AuthController.instance().refreshToken(
    req.query.refreshToken as string
  );
  L.info({ ctx, msg: "get:ext", resp });
  res.send(resp);
});

export { router as oauthRouter };
