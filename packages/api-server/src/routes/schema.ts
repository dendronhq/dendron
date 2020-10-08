import {
  SchemaQueryRequest,
  SchemaWriteRequest,
} from "@dendronhq/common-server";
import { Request, Response, Router } from "express";
import { SchemaController } from "../modules/schemas";

const router = Router();

router.post("/query", async (req: Request, res: Response) => {
  const resp = await SchemaController.instance().query(
    req.body as SchemaQueryRequest
  );
  res.json(resp);
});

router.post("/write", async (req: Request, res: Response) => {
  const resp = await SchemaController.instance().create(
    req.body as SchemaWriteRequest
  );
  res.json(resp);
});

export { router as schemaRouter };
