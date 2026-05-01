import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import requestsRouter from "./requests";
import groupsRouter from "./groups";
import feedbackRouter from "./feedback";
import reportsRouter from "./reports";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/requests", requestsRouter);
router.use("/groups", groupsRouter);
router.use("/feedback", feedbackRouter);
router.use("/reports", reportsRouter);
router.use("/admin", adminRouter);

export default router;
