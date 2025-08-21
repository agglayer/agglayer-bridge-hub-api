import { Logger } from "@polygonlabs/servercore";
import { Hono } from "hono";
import { cors } from "hono/cors";
import router from "./routes";
import { TransactionService } from "./services";
import { DatabaseClient } from "@polygonlabs/servercore-firestore";
import { logger } from "hono/logger";
import { ProofService } from "./services/proof";
import healthCheckRoutes from "./routes/health_check";

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
        new Map([
            ["mainnet", "bridge_hub_api_transactions"],
            ["testnet", "bridge_hub_api_transactions_testnet"],
        ])
    );

    // Parse the CHAIN_CONFIG environment variable and convert it to a Map
    // Parse CHAIN_CONFIG as an object with "mainnet" and "testnet" keys, each mapping to an object of chainId -> url
    const rawConfig = JSON.parse(process.env.CHAIN_CONFIG || "{}");
    // Convert each network's config to a Map<number, string>
    const chainConfig: Map<string, Map<number, string>> = new Map();
    for (const [network, config] of Object.entries(rawConfig)) {
        chainConfig.set(
            network,
            new Map<number, string>(
                Object.entries(config as Map<string, string>).map(
                    ([key, value]) => [Number(key), value]
                )
            )
        );
    }

    // Initialize services
    ProofService.initializeService(chainConfig);

    // Middlewares
    app.use("*", logger()); // Logs all requests
    app.use("*", cors()); // Enables CORS for all routes

    // Register routes
    app.route("/:network/", router);
    app.route("/health-check", healthCheckRoutes);
}

serve();

export default {
    port: process.env.PORT || 3001,
    fetch: app.fetch,
};
