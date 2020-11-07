import {
  WorkspaceInitRequest,
  WorkspaceSyncRequest,
} from "@dendronhq/common-server";
import { Request, Response, Router } from "express";
import { OK } from "http-status-codes";
import _ from "lodash";
import { WorkspaceController } from "../modules/workspace";
import { MemoryStore } from "../store/memoryStore";

const router = Router();

router.post("/initialize", async (req: Request, res: Response) => {
  const resp = await WorkspaceController.instance().init(
    req.body as WorkspaceInitRequest
  );
  res.json(resp);
});

router.get("/all", async (_req: Request, res: Response) => {
  const workspaces = await MemoryStore.instance().list("ws");
  const data = _.keys(workspaces);
  return res.status(OK).json({ workspaces: data });
});

router.post("/sync", async (req: Request, res: Response) => {
  const resp = await WorkspaceController.instance().sync(
    req.body as WorkspaceSyncRequest
  );
  res.json(resp);
});

export { router as workspaceRouter };
