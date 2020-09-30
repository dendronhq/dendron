import { NoteRawProps, SchemaRawProps } from "@dendronhq/common-all";
import { DendronEngine, StorageV2 } from "@dendronhq/engine-server";
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
  let notes: NoteRawProps[] = [];
  let schemas: SchemaRawProps[] = [];
  if (!val) {
    const { vaults } = config;
    const engine = DendronEngine.getOrCreateEngine({
      root: vaults[0],
      forceNew: true,
      // @ts-ignore
      store: new StorageV2({ root: vaults[0] }),
    });
    await engine.init();
    notes = _.values(engine.notes).map((ent) => ent.toRawProps());
    schemas = _.values(engine.schemas).map((ent) => ent.toRawProps());
    MemoryStore.instance().put(`ws:${uri}`, engine);
  }
  const payload = { notes, schemas };
  return res.json(payload);
});

router.get("/all", async (_req: Request, res: Response) => {
  const workspaces = await MemoryStore.instance().list("ws");
  const data = _.keys(workspaces);
  return res.status(OK).json({ workspaces: data });
});

export { router as workspaceRouter };
