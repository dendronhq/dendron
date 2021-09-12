import { AssetGetRequest, AssetGetThemeRequest } from "@dendronhq/common-all";
import { ExpressUtils } from "@dendronhq/common-server";
import { Request, Response, Router } from "express";
import asyncHandler from 'express-async-handler';
import { getLogger } from "../core";
import { AssetsController } from "../modules/assets";

// Init router and path
const router = Router();

const L = getLogger();
const ctx = "assets";

router.get("/", asyncHandler(async (req: Request, res: Response) => {
  L.info({ ctx, msg: "enter", query: req.query });
  const resp = await AssetsController.instance().get(
    req.query as AssetGetRequest
  );
  if (ExpressUtils.handleError(res, resp)) return;
  res.sendFile(resp.data!);
}));

router.get("/theme", asyncHandler(async (req: Request, res: Response) => {
  L.info({ ctx, msg: "enter", query: req.query });
  const resp = await AssetsController.instance().getTheme(
    req.query as AssetGetThemeRequest
  );
  if (ExpressUtils.handleError(res, resp)) return;
  res.sendFile(resp.data!);
}));

export { router as assetsRouter };
