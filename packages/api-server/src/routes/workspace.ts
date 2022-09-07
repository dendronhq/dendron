import {
  DendronError,
  ERROR_STATUS,
  WorkspaceInitRequest,
  WorkspaceSyncRequest,
} from "@dendronhq/common-all";
import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import _ from "lodash";
import { WorkspaceController } from "../modules/workspace";

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
