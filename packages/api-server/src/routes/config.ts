import { ConfigWriteOpts } from "@dendronhq/common-all";
import { WorkspaceRequest } from "@dendronhq/common-server";
import { Request, Response, Router } from "express";
import { getLogger } from "../core";
import { ConfigController } from "../modules/config";

const router = Router();
const L = getLogger();
const ctx = "config";

router.get("/get", async (req: Request, res: Response) => {
  L.info({ ctx, msg: "get:enter" });
  const resp = await ConfigController.instance().get(
    req.query as WorkspaceRequest
  );
  L.info({ ctx, msg: "get:ext", resp });
  res.json(resp);
});

router.post("/write", async (req: Request, res: Response) => {
  L.info({ ctx, msg: "write:enter", payload: req.body });
  const resp = await ConfigController.instance().write(
    req.body as ConfigWriteOpts & WorkspaceRequest
  );
  res.json(resp);
});

export { router as configRouter };
