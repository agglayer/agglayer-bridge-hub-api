import {
	ApiError,
	Logger,
	setupHealthCheckServer,
} from "@polygonlabs/servercore";
import axios from "axios";
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
import { DatabaseClient } from "@polygonlabs/servercore-firestore";
import { ClaimReadinessConsumer } from "./claim_readiness_consumer";
import bridgeAbi from "./interfaces/PolygonZkEVMBridge";

let database: DatabaseClient;

const bridgeAddress = new Map([
	["mainnet", "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe"],
	["testnet", "0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582"],
]);

async function start(): Promise<void> {
	try {
		const collectionsConfig =
			process.env.NETWORK === "mainnet"
				? {
						transactions: "bridge_hub_api_transactions",
						tokenMappings: "bridge_hub_api_mappings",
						metadata: "bridge_hub_api_metadata",
					}
				: {
						transactions: "bridge_hub_api_transactions_testnet",
						tokenMappings: "bridge_hub_api_mappings_testnet",
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

		const tokenMappingsService = new TokenMappingsService(
			database,
			collectionsConfig.tokenMappings
		);

		const bridgeAPIConsumer = new BridgeAPIConsumer(
			{
				apiUrl: new URL(`${process.env.BRIDGE_SERVICE_URL}/bridges`),
				startCount: { key: "deposit_count", value: 0 },
				cronExpr: "0/10 * * * * *",
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
				startCount: { key: "block_num", value: 0 },
				cronExpr: "0/10 * * * * *",
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
				startCount: { key: "block_num", value: 0 },
				cronExpr: "0/10 * * * * *",
				pollSize: 2,
				method: "GET",
				params: {
					network_id: process.env.NETWORK_ID || "0",
					page_size: "2",
				},
				paginationParam: "page_number",
				resultPath: "token_mappings",
			},
			new TransactionMapper(
				Number(process.env.NETWORK_ID) || 0,
				Number(process.env.ETROG_UPDATE_BLOCK_NUMBER) || 0
			),
			new TokenMappingsMapper(Number(process.env.NETWORK_ID) || 0),
			new MetadataMapper(),
			transactionService,
			tokenMappingsService,
			new MetadataService(
				database,
				collectionsConfig.metadata,
				process.env.METADATA_DOC || "lastIndexedTransactions"
			)
		);

		const claimReadinessConsumer = new ClaimReadinessConsumer(
			{
				cronExpr: "0/30 * * * * *",
				networkId: Number(process.env.NETWORK_ID) || 0,
				l1InfoTreeIndexUrl: `${process.env.BRIDGE_SERVICE_URL}/l1-info-tree-index`,
				injectedL1InfoLeafUrl: `${process.env.BRIDGE_SERVICE_URL}/injected-l1-info-leaf`,
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
							address: (process.env.BRIDGE_CONTRACT_ADDRESS ||
								bridgeAddress.get(
									process.env.NETWORK || "mainnet"
								)) as `0x${string}`,
							abi: bridgeAbi,
							functionName: "depositCount",
						}),
						axios.get(
							`${process.env.BRIDGE_SERVICE_URL}/bridges?network_id=${process.env.NETWORK_ID}`
						),
						axios.get(
							`${process.env.BRIDGE_SERVICE_URL}/token-mappings?network_id=${process.env.NETWORK_ID}`
						),
						axios.get(
							`${process.env.BRIDGE_SERVICE_URL}/claims?network_id=${process.env.NETWORK_ID}`
						),
						transactionService.getLatestBridgeTransactions(
							Number(process.env.NETWORK_ID)
						),
					]);

					const depositCnt =
						Number((depositCount as bigint).toString()) - 1;
					const latestBridge = bridges?.data?.bridges?.[0] || null;
					const latestMapping =
						mappings?.data?.token_mappings?.[0] || null;
					const latestClaims = claims?.data?.claims?.[0] || null;
					const latestBridgeInDB = latestBridgeFromDB[0] || null;

					if (!latestBridge) {
						throw new ApiError("No bridges found from Aggkit API");
					}

					if (!latestClaims) {
						throw new ApiError("No claims found from Aggkit API");
					}

					if (!latestMapping) {
						throw new ApiError(
							"No token mappings found from Aggkit API"
						);
					}

					if (!latestBridgeInDB || !latestBridgeInDB.timestamp) {
						throw new ApiError(
							"No bridges saved in DB but bridges found in Aggkit API"
						);
					}

					// if deposit count from contract is larger then saved
					if (depositCnt !== latestBridge.deposit_count) {
						throw new ApiError(`Aggkit not in sync`);
					}

					// if deposit count from contract is larger then saved
					if (
						latestBridge.deposit_count >
							latestBridgeInDB.depositCount &&
						Date.now() -
							new Date(latestBridge.timestamp * 1000).getTime() >
							5 * 60 * 1000
					) {
						throw new ApiError(
							`Deposits in DB not in sync. Aggkit: ${latestBridge.deposit_count}, DB: ${latestBridgeInDB.depositCount}`
						);
					}

					const [mappingsFromDb, claimFromDb] = await Promise.all([
						tokenMappingsService.getLatestTokenMapping(
							latestMapping.tx_hash.toLowerCase(),
							latestMapping.block_num
						),
						transactionService.getClaim(
							latestClaims.tx_hash.toLowerCase()
						),
					]);

					if (
						(!mappingsFromDb || mappingsFromDb.length === 0) &&
						Date.now() -
							new Date(
								latestMapping.block_timestamp * 1000
							).getTime() >
							5 * 60 * 1000
					) {
						throw new ApiError(
							`Mappings in DB not in sync. Aggkit: ${latestMapping.tx_hash}`
						);
					}

					if (
						(!claimFromDb || claimFromDb.length === 0) &&
						Date.now() -
							new Date(
								latestClaims.block_timestamp * 1000
							).getTime() >
							5 * 60 * 1000
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

		Logger.info(
			`Consumer for network id ${process.env.NETWORK_ID} started`
		);
	} catch (error) {
		Logger.error(error as Error);
	}
}

start();
