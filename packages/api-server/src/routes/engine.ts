import { EngineQueryRequest } from "@dendronhq/common-all";
import { DendronEngine } from "@dendronhq/engine-server";
import { Request, Response, Router } from "express";
import { MemoryStore } from "../store/memoryStore";

const router = Router();

router.get("/health", async (_req: Request, res: Response) => {
  return res.json({ ok: 1 });
});

router.post("/query", async (req: Request, res: Response) => {
  const { ws, queryString, mode } = req.body as EngineQueryRequest;
  const engine = await MemoryStore.instance().get<DendronEngine>(`ws:${ws}`);
  if (!engine) {
    throw "No Engine";
  }
  const { error, data } = await engine.query(queryString, mode);
  const cleanData = data.map((ent) => ent.toRawProps());
  res.json({ error, data: cleanData });
});

export { router as engineRouter };
