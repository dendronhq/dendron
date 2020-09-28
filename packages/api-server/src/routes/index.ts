import { Request, Response, Router } from "express";
import { engineRouter } from "./engine";
import { workspaceRouter } from "./workspace";

// Init router and path
const router = Router();

// Add sub-routes
router.use("/workspace", workspaceRouter);
router.use("/engine", engineRouter);

// const engineRouter = Router();
// engineRouter.get("health", async (_req: Request, res: Response) => {
//     return res.json({ok: 1});
// });
// router.use("/bond", engineRouter);

// Export the base-router
export { router as baseRouter };
