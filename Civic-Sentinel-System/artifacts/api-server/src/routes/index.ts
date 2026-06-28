import { Router, type IRouter } from "express";
import healthRouter from "./health";
import reportsRouter from "./reports";
import analyticsRouter from "./analytics";
import communityRouter from "./community";

const router: IRouter = Router();

router.use(healthRouter);
router.use(reportsRouter);
router.use(analyticsRouter);
router.use(communityRouter);

export default router;
