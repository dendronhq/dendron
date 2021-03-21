import { DendronError, WriteNoteResp } from "@dendronhq/common-all";
import {
  EngineBulkAddRequest,
  EngineDeleteRequest,
  EngineGetNoteByPathRequest,
  EngineRenameNoteRequest,
  EngineUpdateNoteRequest,
  EngineWriteRequest,
  NoteQueryRequest,
} from "@dendronhq/common-server";
import { Request, Response, Router } from "express";
import { getLogger } from "../core";
import { NoteController } from "../modules/notes";
import { getWS } from "../utils";

const router = Router();
const L = getLogger();

router.post("/delete", async (req: Request, res: Response) => {
  const { ws, id, opts } = req.body as EngineDeleteRequest;
  const engine = await getWS({ ws: ws || "" });
  const { error, data } = await engine.deleteNote(id, opts);
  res.json({ error, data });
});

router.post("/getByPath", async (req: Request, res: Response) => {
  const { ws, ...opts } = req.body as EngineGetNoteByPathRequest;
  const engine = await getWS({ ws: ws || "" });
  const resp = await engine.getNoteByPath(opts);
  res.json(resp);
});

router.get("/info", async (_req: Request, res: Response) => {
  const resp = await NoteController.instance().info();
  res.json(resp);
});

router.post("/rename", async (req: Request, res: Response) => {
  const resp = await NoteController.instance().rename(
    req.body as EngineRenameNoteRequest
  );
  if (resp.error) {
    res.status(400).json({ error: resp.error });
  } else {
    res.json(resp);
  }
});

router.get("/query", async (req: Request, res: Response) => {
  const resp = await NoteController.instance().query(
    req.query as NoteQueryRequest
  );
  res.json(resp);
});

router.post("/update", async (req: Request, res: Response) => {
  const ctx = "router:note:update";
  const resp = await NoteController.instance().update(
    req.body as EngineUpdateNoteRequest
  );
  L.debug({ ctx, msg: "exit", payload: req.body });
  res.json(resp);
});

router.post("/write", async (req: Request, res: Response<WriteNoteResp>) => {
  const { ws, node, opts } = req.body as EngineWriteRequest;
  const engine = await getWS({ ws: ws || "" });
  try {
    const out = await engine.writeNote(node, opts);
    res.json(out);
  } catch (err) {
    res.json({
      error: new DendronError({ msg: JSON.stringify(err) }),
      data: [],
    });
  }
});

router.post("/bulkAdd", async (req: Request, res: Response<WriteNoteResp>) => {
  const { ws, opts } = req.body as EngineBulkAddRequest;
  const engine = await getWS({ ws: ws || "" });
  try {
    const out = await engine.bulkAddNotes(opts);
    res.json(out);
  } catch (err) {
    res.json({
      error: new DendronError({ msg: JSON.stringify(err) }),
      data: [],
    });
  }
});

export { router as noteRouter };
