import { SchemaWriteRequest } from "@dendronhq/common-server";
import { Request, Response, Router } from "express";
import { SchemaController } from "../modules/schemas";

const router = Router();

router.post("/write", async (req: Request, res: Response) => {
  const resp = await SchemaController.instance().create(
    req.body as SchemaWriteRequest
  );
  res.json(resp);
});

export { router as schemaRouter };
