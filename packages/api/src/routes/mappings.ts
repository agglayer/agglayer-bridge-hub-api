import { Hono } from "hono";
import {
	validateMappingsByTokenQueryParams,
	validateMappingsQueryParams,
} from "../middlewares/validate_query_params";
import { getMappings, getMappingsByToken } from "../controllers/mappings";

const mappingsRoutes = new Hono();

mappingsRoutes.get("/", validateMappingsQueryParams, getMappings);
mappingsRoutes.get(
	"/:tokenNetwork/:tokenAddress",
	validateMappingsByTokenQueryParams,
	getMappingsByToken
);

export default mappingsRoutes;
