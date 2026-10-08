import { Router, type IRouter } from "express";
import healthRouter from "./health";
import agriGuideRouter from "./agriguide";

const router: IRouter = Router();

router.use(healthRouter);
router.use(agriGuideRouter);

export default router;
