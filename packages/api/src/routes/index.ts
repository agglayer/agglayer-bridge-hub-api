import { Hono } from "hono";
import transactionRoutes from "./transactions";
import mappingsRoutes from "./mappings";
import healthCheckRoutes from "./health_check";
import proofRoutes from "./proof";

const router = new Hono();

router.route("/transactions", transactionRoutes);
router.route("/token-mappings", mappingsRoutes);
router.route("/claim-proof", proofRoutes);
router.route("/health-check", healthCheckRoutes);

export default router;
