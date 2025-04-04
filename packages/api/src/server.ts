import { Hono } from "hono";
import { logger } from "hono/logger";
import { cors } from "hono/cors";
import router from "./routes";
import { Logger } from "bridge-hub-commons/helpers/logger";
import { DatabaseClient } from "bridge-hub-commons/helpers/database";

const app = new Hono();
let database: DatabaseClient;

async function serve(): Promise<void> {
    Logger.create({
        sentry: {
            dsn: process.env.SENTRY_DSN,
            level: "error",
        },
        console: {
            level: "info",
        },
    });

    database = new DatabaseClient(
        process.env.GOOGLE_CLOUD_PROJECT_ID ?? "",
        process.env.FIRESTORE_DATABASE_ID ?? ""
    );

    // Middlewares
    app.use("*", logger()); // Logs all requests
    app.use("*", cors()); // Enables CORS for all routes

    // Register routes
    app.route("/", router);
}

serve();

export default {
    port: process.env.PORT || 3000,
    fetch: app.fetch,
};
