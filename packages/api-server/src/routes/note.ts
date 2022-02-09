import {
  EngineBulkAddRequest,
  EngineDeleteRequest,
  EngineGetNoteByPathRequest,
  EngineRenameNoteRequest,
  EngineUpdateNoteRequest,
  EngineWriteRequest,
  GetAnchorsRequest,
  GetDecorationsRequest,
  GetLinksRequest,
  GetNoteBlocksPayload,
  GetNoteBlocksRequest,
  NoteQueryRequest,
  RenderNoteOpts,
  WriteNoteResp,
} from "@dendronhq/common-all";
import { ExpressUtils } from "@dendronhq/common-server";
import { AnchorUtils } from "@dendronhq/engine-server";
import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { getLogger } from "../core";
import { NoteController } from "../modules/notes";
import { getWSEngine } from "../utils";

const router = Router();
const L = getLogger();

router.post(
  "/delete",
  asyncHandler(async (req: Request, res: Response) => {
    const { ws, id, opts } = req.body as EngineDeleteRequest;
    const engine = await getWSEngine({ ws: ws || "" });
    ExpressUtils.setResponse(res, await engine.deleteNote(id, opts));
  })
);

router.post(
  "/getByPath",
  asyncHandler(async (req: Request, res: Response) => {
    const { ws, ...opts } = req.body as EngineGetNoteByPathRequest;
    const engine = await getWSEngine({ ws: ws || "" });
    const resp = await engine.getNoteByPath(opts);
    res.json(resp);
  })
);

router.get(
  "/info",
  asyncHandler(async (_req: Request, res: Response) => {
    const resp = await NoteController.instance().info();
    res.json(resp);
  })
);

router.post(
  "/rename",
  asyncHandler(async (req: Request, res: Response) => {
    const resp = await NoteController.instance().rename(
      req.body as EngineRenameNoteRequest
    );
    ExpressUtils.setResponse(res, resp);
  })
);

router.post(
  "/render",
  asyncHandler(async (req: Request, res: Response) => {
    const resp = await NoteController.instance().render(
      req.body as RenderNoteOpts & { ws: string }
    );
    ExpressUtils.setResponse(res, resp);
  })
);

router.get(
  "/query",
  asyncHandler(async (req: Request, res: Response) => {
    const resp = await NoteController.instance().query(
      req.query as unknown as NoteQueryRequest
    );
    ExpressUtils.setResponse(res, resp);
  })
);

router.post(
  "/update",
  asyncHandler(async (req: Request, res: Response) => {
    const ctx = "router:note:update";
    // TODO: Convert .update() to RespV2 then use ExpressUtils to set the Response
    const resp = await NoteController.instance().update(
      req.body as EngineUpdateNoteRequest
    );
    L.debug({ ctx, msg: "exit", payload: req.body });
    res.json(resp);
  })
);

router.post(
  "/write",
  asyncHandler(async (req: Request, res: Response<WriteNoteResp>) => {
    const { ws, node, opts } = req.body as EngineWriteRequest;
    const engine = await getWSEngine({ ws: ws || "" });
    const out = await engine.writeNote(node, opts);
    ExpressUtils.setResponse(res, out);
  })
);

router.post(
  "/bulkAdd",
  asyncHandler(async (req: Request, res: Response<WriteNoteResp>) => {
    const { ws, opts } = req.body as EngineBulkAddRequest;
    const engine = await getWSEngine({ ws: ws || "" });
    const out = await engine.bulkAddNotes(opts);
    ExpressUtils.setResponse(res, out);
  })
);

router.get(
  "/blocks",
  asyncHandler(async (req: Request, res: Response<GetNoteBlocksPayload>) => {
    const { id, ws, filterByAnchorType } = req.query as GetNoteBlocksRequest;
    const engine = await getWSEngine({ ws: ws || "" });
    ExpressUtils.setResponse(
      res,
      await engine.getNoteBlocks({ id, filterByAnchorType })
    );
  })
);

router.post(
  "/decorations",
  asyncHandler(async (req: Request, res: Response<GetNoteBlocksPayload>) => {
    const opts = req.body as any as GetDecorationsRequest;
    const { ws } = opts;
    const engine = await getWSEngine({ ws: ws || "" });
    ExpressUtils.setResponse(res, await engine.getDecorations(opts));
  })
);

router.get(
  "/links",
  asyncHandler(async (req: Request, res: Response) => {
    const opts = req.body as GetLinksRequest;
    const { ws } = opts;
    const engine = await getWSEngine({ ws });
    const links = engine.getLinks(opts);
    ExpressUtils.setResponse(res, { data: links, error: null });
  })
);

router.get(
  "/anchors",
  asyncHandler(async (req: Request, res: Response) => {
    const { note } = req.body as GetAnchorsRequest;
    const anchors = AnchorUtils.findAnchors({
      note,
    });
    ExpressUtils.setResponse(res, { data: anchors, error: null });
  })
);

export { router as noteRouter };
