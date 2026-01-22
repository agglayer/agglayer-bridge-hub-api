import { Hono } from "hono";
import { HealthCheckController } from "../controllers/health_check";
import { validateAutoClaimHealthCheckQueryParams } from "../middlewares/validate_query_params";
import { HealthCheckService } from "../services/health_check";

const createHealthCheckRoutes = (healthCheckService: HealthCheckService) => {
	const healthCheckRoutes = new Hono();
	const healthCheckController = new HealthCheckController(healthCheckService);

	healthCheckRoutes.get("/", healthCheckController.checkServiceHealth);
	healthCheckRoutes.get(
		"/auto-claim/:network",
		validateAutoClaimHealthCheckQueryParams,
		healthCheckController.checkAutoClaimServiceHealth
	);

	return healthCheckRoutes;
};

export default createHealthCheckRoutes;
