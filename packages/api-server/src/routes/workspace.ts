import {
  DendronError,
  ERROR_STATUS,
  RespV2,
  WorkspaceInitRequest,
  WorkspaceSyncRequest,
} from "@dendronhq/common-all";
import { ExpressUtils } from "@dendronhq/common-server";
import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import _ from "lodash";
import { WorkspaceController } from "../modules/workspace";
import { MemoryStore } from "../store/memoryStore";

const router = Router();

router.post(
  "/initialize",
  asyncHandler(async (req: Request, res: Response) => {
    const resp = await WorkspaceController.instance().init(
      req.body as WorkspaceInitRequest
    );
    res.json(resp);
  })
);

router.get(
  "/all",
  asyncHandler(async (_req: Request, res: Response) => {
    const workspaces = await MemoryStore.instance().list("ws");
    const data = _.keys(workspaces);

    ExpressUtils.setResponse(res, {
      data: { workspaces: data },
    } as RespV2<any>);
  })
);

router.post(
  "/sync",
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const resp = await WorkspaceController.instance().sync(
        req.body as WorkspaceSyncRequest
      );
      res.json(resp);
    } catch (err) {
      res.json({
        error: new DendronError({
          message: ERROR_STATUS.ENGINE_NOT_SET,
          payload: err,
        }),
      });
    }
  })
);

export { router as workspaceRouter };
