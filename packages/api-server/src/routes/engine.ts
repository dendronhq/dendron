import {
  DEngineV2,
  EngineQueryRequest,
  EngineWriteRequest,
} from "@dendronhq/common-all";
import { DendronEngineV2 } from "@dendronhq/engine-server";
import { Request, Response, Router } from "express";
import { MemoryStore } from "../store/memoryStore";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  return res.json({ ok: 1 });
});

router.post("/query", async (req: Request, res: Response) => {
  const { ws, queryString, mode } = req.body as EngineQueryRequest;
  const engine = await MemoryStore.instance().get<DendronEngineV2>(`ws:${ws}`);
  if (!engine) {
    throw "No Engine";
  }
  const { error, data } = await engine.query(queryString, mode);
  res.json({ error, data });
});

router.post("/write", async (req: Request, res: Response) => {
  const { ws, node, opts } = req.body as EngineWriteRequest;
  const engine = await MemoryStore.instance().get<DEngineV2>(`ws:${ws}`);
  if (!engine) {
    throw "No Engine";
  }
  try {
    await engine.writeNote(node, opts);
    res.json({ error: null, data: null });
  } catch (err) {
    res.json({ error: JSON.stringify(err), data: null });
  }
});

export { router as engineRouter };
