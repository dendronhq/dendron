import { ConfigWriteOpts } from "@dendronhq/common-all/src";
import { WorkspaceRequest } from "@dendronhq/common-server";
import { Request, Response, Router } from "express";
import { getLogger } from "../core";
import { getWS } from "../utils";

const router = Router();
const L = getLogger();
const ctx = "config";

router.get("/get", async (req: Request, res: Response) => {
  const { ws } = req.query as WorkspaceRequest;
  L.info({ ctx, msg: "get:enter" });
  const engine = await getWS({ ws: ws || "" });
  const resp = await engine.getConfig();
  res.json(resp);
});

router.post("/write", async (req: Request, res: Response) => {
  const { ws, ...opts } = req.body as ConfigWriteOpts & WorkspaceRequest;
  L.info({ ctx, msg: "get:enter" });
  const engine = await getWS({ ws: ws || "" });
  const resp = await engine.writeConfig(opts);
  res.json(resp);
});

export { router as configRouter };
