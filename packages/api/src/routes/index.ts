import { Hono } from "hono";
import transactionRoutes from "./transactions";
import mappingsRoutes from "./mappings";
import healthCheckRoutes from "./health_check";

const router = new Hono();

router.route("/transactions", transactionRoutes);
router.route("/token-mappings", mappingsRoutes);
router.route("/health-check", healthCheckRoutes);

export default router;
