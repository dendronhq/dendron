import express, { Request, Response, NextFunction } from "express";
import { BAD_REQUEST } from "http-status-codes";
import morgan from "morgan";
import { baseRouter } from "./routes";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.get("/health", async (_req: Request, res: Response) => {
  return res.json({ ok: 1 });
});

app.use("/api", baseRouter);
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.message, err);
  return res.status(BAD_REQUEST).json({
    error: err.message,
  });
});

export default app;
