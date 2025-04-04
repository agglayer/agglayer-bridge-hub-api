import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import router from "./routes";

const app = new Hono();

// Middlewares
app.use("*", logger()); // Logs all requests
app.use("*", cors()); // Enables CORS for all routes

// Register routes
app.route("/", router);

export default {
    port: process.env.PORT || 3000,
    fetch: app.fetch,
};
