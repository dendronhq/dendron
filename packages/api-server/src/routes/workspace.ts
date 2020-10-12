import { NotePropsDictV2, SchemaModuleDictV2 } from "@dendronhq/common-all";
import { createLogger, InitializePayload } from "@dendronhq/common-server";
import { DendronEngineV2, FileStorageV2 } from "@dendronhq/engine-server";
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
  // const val = await MemoryStore.instance().get(`ws:${uri}`);
  let notes: NotePropsDictV2;
  let schemas: SchemaModuleDictV2;
  const logger = createLogger("api-server");
  const { vaults } = config;
  const engine = new DendronEngineV2({
    vaults,
    forceNew: true,
    store: new FileStorageV2({ vaults, logger }),
    mode: "fuzzy",
    logger,
  });
  const { error } = await engine.init();
  if (error) {
    error.friendly = "error initializing notes";
    return res.json({ error });
  }
  notes = engine.notes;
  schemas = engine.schemas;
  MemoryStore.instance().put(`ws:${uri}`, engine);
  const payload: InitializePayload = {
    error: null,
    data: { notes, schemas },
  };
  return res.json(payload);
});

router.get("/all", async (_req: Request, res: Response) => {
  const workspaces = await MemoryStore.instance().list("ws");
  const data = _.keys(workspaces);
  return res.status(OK).json({ workspaces: data });
});

export { router as workspaceRouter };
