import { Router } from "express";
import { assetsRouter } from "./assets";
import { configRouter } from "./config";
import { noteRouter } from "./note";
import { schemaRouter } from "./schema";
import { workspaceRouter } from "./workspace";

// Init router and path
const router = Router();

// Add sub-routes
router.use("/workspace", workspaceRouter);
router.use("/note", noteRouter);
router.use("/schema", schemaRouter);
router.use("/config", configRouter);
router.use("/assets", assetsRouter);

// const engineRouter = Router();
// engineRouter.get("health", async (_req: Request, res: Response) => {
//     return res.json({ok: 1});
// });
// router.use("/bond", engineRouter);

// Export the base-router
export { router as baseRouter };
