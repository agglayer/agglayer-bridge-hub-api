import { Hono } from "hono";
import transactionRoutes from "./transactions";
import mappingsRoutes from "./mappings";
import proofRoutes from "./proof";

const router = new Hono();

router.route("/transactions", transactionRoutes);
router.route("/token-mappings", mappingsRoutes);
router.route("/claim-proof", proofRoutes);

export default router;
