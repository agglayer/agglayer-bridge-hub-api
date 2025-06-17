import { Logger } from "@polygonlabs/servercore";
import { Hono } from "hono";
import { cors } from "hono/cors";
import router from "./routes";
import { TransactionService } from "./services";
import { DatabaseClient } from "@polygonlabs/servercore-firestore";
import { logger } from "hono/logger";

const app = new Hono();

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

    const database = new DatabaseClient({
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID ?? "",
        databaseId: process.env.FIRESTORE_DATABASE_ID ?? "",
    });
    await database.connect();

    const transactionService = TransactionService.initializeTransactionService(
        database,
        "bridge_hub_api_transactions"
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
