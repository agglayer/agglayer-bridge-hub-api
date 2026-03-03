import { Hono } from "hono";
import { HealthCheckController } from "../controllers/health_check";

const createHealthCheckRoutes = () => {
	const healthCheckRoutes = new Hono();
	const healthCheckController = new HealthCheckController();

	healthCheckRoutes.get("/", healthCheckController.checkServiceHealth);

	return healthCheckRoutes;
};

export default createHealthCheckRoutes;
