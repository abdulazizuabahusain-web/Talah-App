import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import requestsRouter from "./requests";
import groupsRouter from "./groups";
import feedbackRouter from "./feedback";
import reportsRouter from "./reports";
import surveysRouter from "./surveys";
import analyticsRouter from "./analytics";
import adminRouter from "./admin";
import connectionsRouter from "./connections";
import venuesRouter from "./venues";
import waitlistRouter from "./waitlist";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/requests", requestsRouter);
router.use("/groups", groupsRouter);
router.use("/feedback", feedbackRouter);
router.use("/reports", reportsRouter);
router.use("/surveys", surveysRouter);
router.use("/connections", connectionsRouter);
router.use("/venues", venuesRouter);
router.use("/admin/analytics", analyticsRouter);
router.use("/admin", adminRouter);
router.use(waitlistRouter);

export default router;
