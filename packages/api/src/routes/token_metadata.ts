import { Hono } from "hono";
import { validateTokenMetadataQueryParams } from "../middlewares/validate_query_params";
import { getTokenMetadata } from "../controllers/token_metadata";

const tokenMetadataRoutes = new Hono();

tokenMetadataRoutes.get(
    "/:tokenAddress",
    validateTokenMetadataQueryParams,
    getTokenMetadata
);

export default tokenMetadataRoutes;
