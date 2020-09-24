import { Request, Response, Router } from "express";
import { BAD_REQUEST, CREATED, OK } from "http-status-codes";
const router = Router();

router.put("/update", async (req: Request, res: Response) => {
  const { user } = req.body;
  console.log("got update");
  if (!user) {
    return res.status(BAD_REQUEST).json({
      error: "param missing",
    });
  }
  return res.status(OK).json({ users: "1" });
  // user.id = Number(user.id);
  // await userDao.update(user);
  // return res.status(OK).end();
});
router.get("/all", async (req: Request, res: Response) => {
  return res.status(OK).json({ users: "1" });
});

export default router;
