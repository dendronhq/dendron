import { DendronEngine } from "@dendronhq/engine-server";
import { Request, Response, Router } from "express";
import { OK } from "http-status-codes";
import _ from "lodash";
import { MemoryStore } from "../store/memoryStore";

type WorkspaceInitRequest = {
  uri: string;
  config: any;
};

const router = Router();

router.post("/initialize", async (req: Request, res: Response) => {
  const { uri, config } = req.body as WorkspaceInitRequest;
  const val = await MemoryStore.instance().get(`ws:${uri}`);
  if (!val) {
    const { vaults } = config;
    const engine = DendronEngine.getOrCreateEngine({
      root: vaults[0],
      forceNew: true,
    });
    await engine.init();
    MemoryStore.instance().put(`ws:${uri}`, engine);
  }
  return res.status(OK).end();
});

router.get("/all", async (_req: Request, res: Response) => {
  const workspaces = await MemoryStore.instance().list("ws");
  const data = _.keys(workspaces);
  return res.status(OK).json({ workspaces: data });
});

export { router as workspaceRouter };
