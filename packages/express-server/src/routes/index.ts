import { Router } from "express";
import UserRouter from "./Users";
import EngineRouter from "./Engine";

// Init router and path
const router = Router();

// Add sub-routes
router.use("/users", UserRouter);
router.use("/engine", EngineRouter);

// Export the base-router
export default router;
