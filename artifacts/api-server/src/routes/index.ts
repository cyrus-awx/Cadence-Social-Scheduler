import { Router, type IRouter } from "express";
import healthRouter from "./health";
import billingRouter from "./billing";

const router: IRouter = Router();

router.use(healthRouter);
router.use(billingRouter);

export default router;
