import dotenv from "dotenv";
dotenv.config(); // Load environment variables first

import { Logger, setupHealthCheckServer } from "@polygonlabs/servercore";

// Initialize the logger globally
Logger.create({
    sentry: {
        dsn: process.env.SENTRY_DSN,
        level: "error",
    },
    console: {
        level: "info",
    },
});

import { BridgeAPIConsumer } from "./bridge_api_consumer";
import TransactionMapper from "./mappers/transaction";
import TokenMappingsMapper from "./mappers/mapping";
import TokenMappingsService from "./services/mapping";
import TransactionsService from "./services/transaction";
import MetadataService from "./services/metadata";
import MetadataMapper from "./mappers/metadata";
import { DatabaseClient } from "@polygonlabs/servercore-firestore";
import { ClaimReadinessConsumer } from "./claim_readiness_consumer";

let database: DatabaseClient;

async function start(): Promise<void> {
    try {
        const collectionsConfig =
            process.env.NETWORK === "mainnet"
                ? {
                      transactions: "bridge_hub_api_transactions",
                      tokenMappings: "bridge_hub_api_tokenMappings",
                      metadata: "bridge_hub_api_metadata",
                  }
                : {
                      transactions: "bridge_hub_api_transactions_testnet",
                      tokenMappings: "bridge_hub_api_tokenMappings_testnet",
                      metadata: "bridge_hub_api_metadata_testnet",
                  };

        database = new DatabaseClient({
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID ?? "",
            databaseId: process.env.FIRESTORE_DATABASE_ID ?? "",
        });
        await database.connect();

        const transactionService = new TransactionsService(
            database,
            collectionsConfig.transactions
        );

        const bridgeAPIConsumer = new BridgeAPIConsumer(
            {
                apiUrl: new URL(`${process.env.BRIDGE_SERVICE_URL}/bridges`),
                startCount: { key: "deposit_count", value: 0 },
                cronExpr: "0/10 * * * * ?",
                pollSize: 2,
                method: "GET",
                params: {
                    network_id: process.env.NETWORK_ID || "0",
                    page_size: "2",
                },
                paginationParam: "page_number",
                resultPath: "bridges",
            },
            {
                apiUrl: new URL(`${process.env.BRIDGE_SERVICE_URL}/claims`),
                startCount: { key: "block_number", value: 0 },
                cronExpr: "0/10 * * * * ?",
                pollSize: 2,
                method: "GET",
                params: {
                    network_id: process.env.NETWORK_ID || "0",
                    page_size: "2",
                },
                paginationParam: "page_number",
                resultPath: "claims",
            },
            {
                apiUrl: new URL(
                    `${process.env.BRIDGE_SERVICE_URL}/token-mappings`
                ),
                startCount: { key: "block_number", value: 0 },
                cronExpr: "0/10 * * * * ?",
                pollSize: 2,
                method: "GET",
                params: {
                    network_id: process.env.NETWORK_ID || "0",
                    page_size: "2",
                },
                paginationParam: "page_number",
                resultPath: "token_mappings",
            },
            new TransactionMapper(Number(process.env.NETWORK_ID) || 0),
            new TokenMappingsMapper(Number(process.env.NETWORK_ID) || 0),
            new MetadataMapper(),
            transactionService,
            new TokenMappingsService(database, collectionsConfig.tokenMappings),
            new MetadataService(
                database,
                collectionsConfig.metadata,
                process.env.METADATA_DOC || "lastIndexedTransactions"
            )
        );

        const claimReadinessConsumer = new ClaimReadinessConsumer(
            {
                cronExpr: "0/30 * * * * ?",
                networkId: Number(process.env.NETWORK_ID) || 0,
                l1InfoTreeIndexUrl: `${process.env.BRIDGE_SERVICE_URL}/l1-info-tree-index`,
                injectedL1InfoLeafUrl: `${process.env.BRIDGE_SERVICE_URL}/injected-l1-info-leaf`,
            },
            transactionService
        );

        setupHealthCheckServer(
            [
                `${process.env.BRIDGE_SERVICE_URL}/bridges?network_id=${process.env.NETWORK_ID}`,
            ],
            Number(process.env.HEALTH_CHECK_PORT || "3001")
        );
        await bridgeAPIConsumer.start();
        await claimReadinessConsumer.start();

        Logger.info(
            `Consumer for network id ${process.env.NETWORK_ID} started`
        );
    } catch (error) {
        Logger.error(error as Error);
    }
}

start();
