import {
	ApiError,
	Logger,
	setupHealthCheckServer,
} from "@polygonlabs/servercore";
import { createPublicClient, http } from "viem";

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
import { MongoDBClient } from "./db/mongo-client";
import { ClaimReadinessConsumer } from "./claim_readiness_consumer";
import bridgeAbi from "./interfaces/PolygonZkEVMBridge";
import { BRIDGE_ADDRESSES, COLLECTIONS_CONFIG } from "./config";

let database: MongoDBClient;

const NETWORK_ID = process.env.NETWORK_ID || "0";
const BRIDGE_SERVICE_URL = process.env.BRIDGE_SERVICE_URL;
const NETWORK = process.env.NETWORK || "mainnet";
const BRIDGE_CONTRACT_ADDRESS = process.env.BRIDGE_CONTRACT_ADDRESS;
const ETROG_UPDATE_BLOCK_NUMBER = process.env.ETROG_UPDATE_BLOCK_NUMBER || "0";
const FIVE_MINUTES_MS = 5 * 60 * 1000;

// Helper function to build Bridge API URLs
const buildBridgeApiUrl = (endpoint: string, limit = 1): string =>
	`${BRIDGE_SERVICE_URL}/${endpoint}?network_id=${NETWORK_ID}&limit=${limit}`;

// Helper function to fetch with validation
const fetchWithValidation = async (url: string): Promise<any> => {
	const response = await fetch(url);
	if (!response.ok) {
		throw new ApiError(`Failed to fetch ${url}: ${response.statusText}`);
	}
	return response.json();
};

async function start(): Promise<void> {
	try {
		const collectionsConfig =
			COLLECTIONS_CONFIG.get(NETWORK) ||
			COLLECTIONS_CONFIG.get("devnet")!;

		database = new MongoDBClient(
			process.env.MONGODB_CONNECTION_URI || "mongodb://localhost:27017",
			process.env.MONGODB_DB_NAME || "bridge_hub"
		);
		await database.connect();

		const transactionService = new TransactionsService(
			database.getCollection<any>(collectionsConfig.transactions),
			collectionsConfig.transactions
		);

		const tokenMappingsService = new TokenMappingsService(
			database.getCollection<any>(collectionsConfig.tokenMappings),
			collectionsConfig.tokenMappings
		);

		const bridgeAPIConsumer = new BridgeAPIConsumer(
			{
				apiUrl: new URL(`${BRIDGE_SERVICE_URL}/bridges`),
				startCount: { key: "deposit_count", value: 0 },
				cronExpr: "0/10 * * * * *",
				pollSize: 2,
				method: "GET",
				params: {
					network_id: NETWORK_ID || "0",
					page_size: "2",
				},
				paginationParam: "page_number",
				resultPath: "bridges",
			},
			{
				apiUrl: new URL(`${BRIDGE_SERVICE_URL}/claims`),
				startCount: { key: "block_num", value: 0 },
				cronExpr: "0/10 * * * * *",
				pollSize: 2,
				method: "GET",
				params: {
					network_id: NETWORK_ID || "0",
					page_size: "2",
				},
				paginationParam: "page_number",
				resultPath: "claims",
			},
			{
				apiUrl: new URL(`${BRIDGE_SERVICE_URL}/token-mappings`),
				startCount: { key: "block_num", value: 0 },
				cronExpr: "0/10 * * * * *",
				pollSize: 2,
				method: "GET",
				params: {
					network_id: NETWORK_ID || "0",
					page_size: "2",
				},
				paginationParam: "page_number",
				resultPath: "token_mappings",
			},
			new TransactionMapper(
				Number(NETWORK_ID) || 0,
				Number(ETROG_UPDATE_BLOCK_NUMBER)
			),
			new TokenMappingsMapper(Number(NETWORK_ID) || 0),
			new MetadataMapper(),
			transactionService,
			tokenMappingsService,
			new MetadataService(
				database.getCollection<any>(collectionsConfig.metadata),
				collectionsConfig.metadata,
				process.env.METADATA_DOC || "lastIndexedTransactions"
			)
		);

		const claimReadinessConsumer = new ClaimReadinessConsumer(
			{
				cronExpr: "0/30 * * * * *",
				networkId: Number(NETWORK_ID) || 0,
				l1InfoTreeIndexUrl: `${BRIDGE_SERVICE_URL}/l1-info-tree-index`,
				injectedL1InfoLeafUrl: `${BRIDGE_SERVICE_URL}/injected-l1-info-leaf`,
			},
			transactionService
		);

		const client = createPublicClient({
			transport: http(process.env.RPC_URL || ""),
		});

		setupHealthCheckServer(
			[],
			Number(process.env.HEALTH_CHECK_PORT || "3001"),
			async () => {
				try {
					if (process.env.RESYNCING === "true") {
						return true;
					}

					const [
						depositCount,
						bridges,
						mappings,
						claims,
						latestBridgeFromDB,
					] = await Promise.all([
						client.readContract({
							address: (BRIDGE_CONTRACT_ADDRESS ||
								BRIDGE_ADDRESSES.get(NETWORK)) as `0x${string}`,
							abi: bridgeAbi,
							functionName: "depositCount",
						}),
						fetchWithValidation(buildBridgeApiUrl("bridges")),
						fetchWithValidation(
							buildBridgeApiUrl("token-mappings")
						),
						fetchWithValidation(buildBridgeApiUrl("claims")),
						transactionService.getLatestBridgeTransactions(
							Number(NETWORK_ID)
						),
					]);

					const depositCnt = Number(depositCount) - 1;
					const latestBridge = bridges?.bridges?.[0] || null;
					const latestMapping = mappings?.token_mappings?.[0] || null;
					const latestClaims = claims?.claims?.[0] || null;
					const latestBridgeInDB = latestBridgeFromDB[0] || null;

					if (
						latestBridge &&
						(!latestBridgeInDB || !latestBridgeInDB.timestamp)
					) {
						throw new ApiError(
							"No bridges saved in DB but bridges found in Aggkit API"
						);
					}

					// if deposit count from contract is larger then saved
					if (depositCnt !== latestBridge.deposit_count) {
						throw new ApiError(`Aggkit not in sync`);
					}

					// Cache current timestamp for multiple comparisons
					const now = Date.now();

					// if deposit count from contract is larger then saved
					if (
						latestBridge.deposit_count >
							latestBridgeInDB.depositCount &&
						now -
							new Date(latestBridge.timestamp * 1000).getTime() >
							FIVE_MINUTES_MS
					) {
						throw new ApiError(
							`Deposits in DB not in sync. Aggkit: ${latestBridge.deposit_count}, DB: ${latestBridgeInDB.depositCount}`
						);
					}

					const [mappingsFromDb, claimFromDb] = await Promise.all([
						latestMapping
							? tokenMappingsService.getTokenMapping(
									latestMapping.tx_hash.toLowerCase(),
									latestMapping.block_num
								)
							: Promise.resolve(null),
						latestClaims
							? transactionService.getClaim(
									latestClaims.tx_hash.toLowerCase()
								)
							: Promise.resolve(null),
					]);

					if (
						latestMapping &&
						(!mappingsFromDb || mappingsFromDb.length === 0) &&
						now -
							new Date(
								latestMapping.block_timestamp * 1000
							).getTime() >
							FIVE_MINUTES_MS
					) {
						throw new ApiError(
							`Mappings in DB not in sync. Aggkit: ${latestMapping.tx_hash}`
						);
					}

					if (
						latestClaims &&
						(!claimFromDb || claimFromDb.length === 0) &&
						now -
							new Date(
								latestClaims.block_timestamp * 1000
							).getTime() >
							FIVE_MINUTES_MS
					) {
						throw new ApiError(
							`Claims in DB not in sync. Aggkit: ${latestClaims.tx_hash}`
						);
					}

					return true;
				} catch (error: any) {
					Logger.info({
						location: "bridge_api_consumer_index",
						function: "setupHealthCheckServer",
						status: `ERROR encountered on health check`,
						error: error,
					});
					throw error instanceof ApiError
						? error
						: new ApiError(error.message);
				}
			}
		);
		await bridgeAPIConsumer.start();
		await claimReadinessConsumer.start();

		Logger.info(`Consumer for network id ${NETWORK_ID} started`);
	} catch (error) {
		Logger.error(error as Error);
	}
}

start();
