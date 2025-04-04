import { Hono } from "hono";
import { validateMappingsQueryParams } from "../middlewares/validate_query_params";
import { getMappings } from "../controllers/mappings";

const mappingsRoutes = new Hono();

mappingsRoutes.get("/", validateMappingsQueryParams, getMappings);

export default mappingsRoutes;
