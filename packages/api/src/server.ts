import { Logger } from "@polygonlabs/servercore";
import { OpenAPIHono } from "@hono/zod-openapi";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { Scalar } from "@scalar/hono-api-reference";
import router from "./routes";
import { MappingsService } from "./services/mappings";
import { TokenMetadataService } from "./services/token_metadata";
import { TransactionService } from "./services/transactions";
import { ProofService } from "./services/proof";
import { HealthCheckService } from "./services";
import { DatabaseClient } from "@polygonlabs/servercore-firestore";
import healthCheckRoutes from "./routes/health_check";

const app = new OpenAPIHono();

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

	// Parse the PROOF_CONFIG and RPC_CONFIG environment variable and convert it to a Map
	// Parse PROOF_CONFIG and RPC_CONFIG as an objects with "mainnet" and "testnet" keys, each mapping to an object of chainId -> url
	const rawProofConfig = JSON.parse(process.env.PROOF_CONFIG || "{}");
	// Convert each network's config to a Map<number, string>
	const proofConfig: Map<string, Map<number, string>> = new Map();
	for (const [network, config] of Object.entries(rawProofConfig)) {
		proofConfig.set(
			network,
			new Map<number, string>(
				Object.entries(config as Map<string, string>).map(
					([key, value]) => [Number(key), value]
				)
			)
		);
	}

	const rawRPCConfig = JSON.parse(process.env.RPC_CONFIG || "{}");
	// Convert each network's config to a Map<number, string>
	const rpcConfig: Map<string, Map<number, string>> = new Map();
	for (const [network, config] of Object.entries(rawRPCConfig)) {
		rpcConfig.set(
			network,
			new Map<number, string>(
				Object.entries(config as Map<string, string>).map(
					([key, value]) => [Number(key), value]
				)
			)
		);
	}

	// Initialize services
	TransactionService.initializeTransactionService(
		database,
		new Map([
			["mainnet", "bridge_hub_api_transactions"],
			["testnet", "bridge_hub_api_transactions_testnet"],
		])
	);

	MappingsService.initializeMappingsService(
		database,
		new Map([
			["mainnet", "bridge_hub_api_mappings"],
			["testnet", "bridge_hub_api_mappings_testnet"],
		])
	);

	TokenMetadataService.initializeTokenMetadataService(
		database,
		new Map([
			["mainnet", "bridge_hub_api_mappings"],
			["testnet", "bridge_hub_api_mappings_testnet"],
		]),
		rpcConfig,
		new Map([
			["mainnet", "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe"],
			["testnet", "0x1348947e282138d8f377b467F7D9c2EB0F335d1f"],
		])
	);

	HealthCheckService.initializeHealthCheckService(rpcConfig);

	ProofService.initializeService(proofConfig);

	// Middlewares
	app.use("*", logger()); // Logs all requests
	app.use("*", cors()); // Enables CORS for all routes

	// The OpenAPI documentation will be available at /openapi
	app.doc("/openapi", {
		openapi: "3.0.0",
		info: {
			version: "v1",
			title: "Agglayer Bridge Hub API",
			description:
				"API for accessing bridge transaction data, token mappings, claim proofs, and token metadata",
		},
		servers: [
			{
				url: process.env.API_BASE_URL || "http://localhost:3000",
				description:
					process.env.NODE_ENV === "prod-api"
						? "Production server"
						: "Development server",
			},
		],
	});

	// Scalar API Reference UI
	app.get(
		"/docs",
		Scalar({
			theme: "kepler",
			url: "/openapi",
			pageTitle: "Agglayer Bridge Hub API Documentation",
		})
	);

	// Register routes with network parameter schema
	app.route("/:network", router);
	app.route("/health-check", healthCheckRoutes);
}

serve();

export default {
	port: process.env.PORT || 3001,
	fetch: app.fetch,
};
