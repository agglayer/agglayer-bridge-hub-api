import { Hono } from "hono";
import {
    validateMappingsByOriginTokenQueryParams,
    validateMappingsQueryParams,
} from "../middlewares/validate_query_params";
import { getMappings, getMappingsByOriginToken } from "../controllers/mappings";

const mappingsRoutes = new Hono();

mappingsRoutes.get("/", validateMappingsQueryParams, getMappings);
mappingsRoutes.get(
    "/:originTokenNetwork/:originTokenAddress",
    validateMappingsByOriginTokenQueryParams,
    getMappingsByOriginToken
);

export default mappingsRoutes;
