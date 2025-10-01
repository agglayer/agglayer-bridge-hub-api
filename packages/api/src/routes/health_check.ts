import { Hono } from "hono";
import {
	checkServiceHealth,
	checkAutoClaimServiceHealth,
} from "../controllers/health_check";
import { validateAutoClaimHealthCheckQueryParams } from "../middlewares/validate_query_params";

const healthCheckRoutes = new Hono();

healthCheckRoutes.get("/", checkServiceHealth);
healthCheckRoutes.get(
	"/auto-claim/:network",
	validateAutoClaimHealthCheckQueryParams,
	checkAutoClaimServiceHealth
);

export default healthCheckRoutes;
