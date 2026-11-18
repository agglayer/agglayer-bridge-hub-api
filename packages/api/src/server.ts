import cors from 'cors';
import express from 'express';

import { createErrorHandler, notFoundHandler, setupLogger } from '@polygonlabs/express';
import { createRegistryRouter } from '@polygonlabs/express/registry';
import { createLogger } from '@polygonlabs/logger';
import { Logger } from '@polygonlabs/servercore';
import { MongoDBClient } from '@polygonlabs/servercore-mongo';

import { BRIDGE_ADDRESSES, MAPPINGS_COLLECTIONS, TRANSACTIONS_COLLECTIONS } from './config.ts';
import { HealthCheckController } from './controllers/health_check.ts';
import { MappingsController } from './controllers/mappings.ts';
import { ProofController } from './controllers/proof.ts';
import { TokenMetadataController } from './controllers/token_metadata.ts';
import { TransactionsController } from './controllers/transactions.ts';
import { buildRegistry } from './registry.ts';
import { createOpenApiRouter } from './routes/openapi.ts';
import { MappingsService } from './services/mappings.ts';
import { ProofService } from './services/proof.ts';
import { TokenMetadataService } from './services/token_metadata.ts';
import { TransactionService } from './services/transactions.ts';

const app = express();

async function bootstrap(): Promise<void> {
	// @polygonlabs/servercore's Logger is a process-wide singleton used
	// directly by the service layer (proof.ts, token_metadata.ts) — kept
	// as-is. @polygonlabs/logger below is a second, separate logger instance
	// that only powers @polygonlabs/express's request-scoped setupLogger/
	// getLogger; migrating the service layer off servercore's Logger is
	// tracked separately (epic #117), not part of this framework migration.
	Logger.create({
		sentry: {
			dsn: process.env.SENTRY_DSN,
			level: 'error'
		},
		console: {
			level: 'info'
		}
	});

	const httpLogger = await createLogger();

	const database = new MongoDBClient(
		process.env.MONGODB_CONNECTION_URI || 'mongodb://localhost:27017',
		process.env.MONGODB_DB_NAME || 'bridge_hub'
	);
	await database.connect();

	// Parse the PROOF_CONFIG and RPC_CONFIG environment variable and convert it to a Map
	// Parse PROOF_CONFIG and RPC_CONFIG as an objects with "mainnet", "testnet" and "devnet" keys, each mapping to an object of chainId -> url
	const rawProofConfig = JSON.parse(process.env.PROOF_CONFIG || '{}');
	// Convert each network's config to a Map<number, string>
	const proofConfig: Map<string, Map<number, string>> = new Map();
	for (const [network, config] of Object.entries(rawProofConfig)) {
		proofConfig.set(
			network,
			new Map<number, string>(
				Object.entries(config as Map<string, string>).map(([key, value]) => [Number(key), value])
			)
		);
	}

	const rawRPCConfig = JSON.parse(process.env.RPC_CONFIG || '{}');
	// Convert each network's config to a Map<number, string>
	const rpcConfig: Map<string, Map<number, string>> = new Map();
	for (const [network, config] of Object.entries(rawRPCConfig)) {
		rpcConfig.set(
			network,
			new Map<number, string>(
				Object.entries(config as Map<string, string>).map(([key, value]) => [Number(key), value])
			)
		);
	}

	// Initialize services
	const transactionService = new TransactionService(database.getDb(), TRANSACTIONS_COLLECTIONS);

	const mappingsService = new MappingsService(database.getDb(), MAPPINGS_COLLECTIONS);

	const tokenMetadataService = new TokenMetadataService(
		database.getDb(),
		MAPPINGS_COLLECTIONS,
		rpcConfig,
		BRIDGE_ADDRESSES
	);

	const proofService = new ProofService(proofConfig);

	const transactionsController = new TransactionsController(transactionService);
	const mappingsController = new MappingsController(mappingsService);
	const proofController = new ProofController(proofService, transactionService);
	const tokenMetadataController = new TokenMetadataController(tokenMetadataService);
	const healthCheckController = new HealthCheckController();

	app.use(cors());
	app.use(express.json());

	// `setupLogger` mounts the per-request child-logger middleware AND primes
	// the out-of-request fallback that `getLogger()` reads.
	app.use(setupLogger(httpLogger));

	const registry = buildRegistry();

	// Routes are derived from the `TypedRegistry` — the registry router
	// validates each request against the registered Zod schemas (decoded
	// `req.params`/`req.query` reach handlers as runtime types) and
	// re-encodes responses on the way out against the declared response
	// schema for whatever status the handler actually sent.
	const registryRouter = createRegistryRouter({ registry })
		.implement({
			checkServiceHealth: healthCheckController.checkServiceHealth,
			getTransactions: transactionsController.getTransactions,
			getTransactionByDepositCount: transactionsController.getTransactionByDepositCount,
			getMappings: mappingsController.getMappings,
			getMappingsByToken: mappingsController.getMappingsByToken,
			getClaimProof: proofController.getProof,
			getTokenMetadata: tokenMetadataController.getTokenMetadata
		})
		.toExpress();

	app.use(registryRouter);

	// Out-of-band routes deliberately not in the registry: the spec and
	// interactive docs serve themselves.
	app.use(createOpenApiRouter(registry));

	app.use(notFoundHandler);
	app.use(createErrorHandler());
}

await bootstrap();

app.listen(Number(process.env.PORT) || 3001);
