import { Logger } from "bridge-hub-commons/helpers/logger";
import { JSONRPCClient } from "bridge-hub-commons/helpers/json_rpc_client";
import dotenv from "dotenv";
import { DatabaseClient } from "bridge-hub-commons/helpers/database";
import { BridgeAPIConsumer } from "./bridge_api_consumer";
import TransactionMapper from "./mappers/transaction";
import TokenMappingsMapper from "./mappers/mapping";
import TokenMappingsService from "./services/mapping";
import TransactionsService from "./services/transaction";

dotenv.config();

let jsonRPCClient: JSONRPCClient;
let database: DatabaseClient;

async function start(): Promise<void> {
    try {
        Logger.create({
            sentry: {
                dsn: process.env.SENTRY_DSN,
                level: "error",
            },
            console: {
                level: "info",
            },
        });

        jsonRPCClient = new JSONRPCClient(process.env.BRIDGE_SERVICE_URL ?? "");
        database = new DatabaseClient(
            process.env.GOOGLE_CLOUD_PROJECT_ID ?? "",
            process.env.FIRESTORE_DATABASE_ID ?? ""
        );

        const consumer = new BridgeAPIConsumer(
            jsonRPCClient,
            {
                name: "bridges",
                requestMethod: "bridge_getBridges",
                pollInterval: 5,
                startBlock: Number(process.env.START_BLOCK) || 0,
                pollSize: 10,
                networkId: Number(process.env.NETWORK_ID) || 0,
                maxRetries: 3,
            },
            {
                name: "claims",
                requestMethod: "bridge_getClaims",
                pollInterval: 5,
                startBlock: Number(process.env.START_BLOCK) || 0,
                pollSize: 10,
                networkId: Number(process.env.NETWORK_ID) || 0,
                maxRetries: 3,
            },
            {
                name: "tokenMappings",
                requestMethod: "bridge_getTokenMappings",
                pollInterval: 5,
                startBlock: Number(process.env.START_BLOCK) || 0,
                pollSize: 10,
                networkId: Number(process.env.NETWORK_ID) || 0,
                maxRetries: 3,
            },
            new TransactionMapper(Number(process.env.NETWORK_ID) || 0),
            new TokenMappingsMapper(Number(process.env.NETWORK_ID) || 0),
            new TransactionsService(database, "transactions"),
            new TokenMappingsService(database, "tokenMappings")
        );

        await consumer.start();

        Logger.info(
            `Consumer for network id ${process.env.NETWORK_ID} started`
        );
    } catch (error) {
        Logger.error(error as Error);
    }
}

start();
