import { OpenAPIHono } from "@hono/zod-openapi";
import transactionRoutes from "./transactions";
import mappingsRoutes from "./mappings";
import proofRoutes from "./proof";
import tokenMetadataRoutes from "./token_metadata";

const router = new OpenAPIHono();

router.route("/transactions", transactionRoutes);
router.route("/token-mappings", mappingsRoutes);
router.route("/claim-proof", proofRoutes);
router.route("/token-metadata", tokenMetadataRoutes);

export default router;
