import { Hono } from "hono";
import { checkServiceHealth } from "../controllers/health_check";

const healthCheckRoutes = new Hono();

healthCheckRoutes.get("/", checkServiceHealth);

export default healthCheckRoutes;
