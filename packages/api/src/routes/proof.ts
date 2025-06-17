import { Hono } from "hono";
import { validateClaimProofQueryParams } from "../middlewares/validate_query_params";
import { getProof } from "../controllers/proof";

const proofRoutes = new Hono();

proofRoutes.get("/", validateClaimProofQueryParams, getProof);

export default proofRoutes;
