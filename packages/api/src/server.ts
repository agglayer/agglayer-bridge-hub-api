import { Logger } from "@polygonlabs/servercore";
import { Hono } from "hono";
import { cors } from "hono/cors";
import router from "./routes";
import { TransactionService } from "./services";
import { DatabaseClient } from "@polygonlabs/servercore-firestore";
import { logger } from "hono/logger";
import { ProofService } from "./services/proof";

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

    TransactionService.initializeTransactionService(
        database,
        "bridge_hub_api_transactions"
    );

    // Parse the CHAIN_CONFIG environment variable and convert it to a Map
    const chainConfig = new Map<number, string>(
        Object.entries(JSON.parse(process.env.CHAIN_CONFIG || "{}")).map(
            ([key, value]) => [Number(key), value as string]
        )
    );

    // Initialize services
    ProofService.initializeService(chainConfig);

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
