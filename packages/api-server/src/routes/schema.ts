import {
  SchemaDeleteRequest,
  SchemaQueryRequest,
  SchemaUpdateRequest,
  SchemaWriteRequest,
} from "@dendronhq/common-all";
import { Request, Response, Router } from "express";
import asyncHandler from "express-async-handler";
import { SchemaController } from "../modules/schemas";

const router = Router();

router.post(
  "/delete",
  asyncHandler(async (req: Request, res: Response) => {
    const resp = await SchemaController.instance().delete(
      req.body as SchemaDeleteRequest
    );
    res.json(resp);
  })
);

router.post(
  "/query",
  asyncHandler(async (req: Request, res: Response) => {
    const resp = await SchemaController.instance().query(
      req.body as SchemaQueryRequest
    );
    res.json(resp);
  })
);

router.post(
  "/update",
  asyncHandler(async (req: Request, res: Response) => {
    const resp = await SchemaController.instance().update(
      req.body as SchemaUpdateRequest
    );
    res.json(resp);
  })
);

router.post(
  "/write",
  asyncHandler(async (req: Request, res: Response) => {
    const resp = await SchemaController.instance().create(
      req.body as SchemaWriteRequest
    );
    res.json(resp);
  })
);

export { router as schemaRouter };
