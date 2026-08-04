import { ApiError, Logger } from '@polygonlabs/servercore';

// Initialize the logger globally
Logger.create({
	sentry: {
		dsn: process.env.SENTRY_DSN,
		level: 'error'
	},
	console: {
		level: process.env.LOG_LEVEL || 'info'
	}
});

import { MongoDBClient } from '@polygonlabs/servercore-mongo';

import { BridgeAPIConsumer } from './bridge_api_consumer.ts';
import { ClaimReadinessConsumer } from './claim_readiness_consumer.ts';
import { COLLECTIONS_CONFIG } from './config.ts';
import { startHealthCheckServer } from './health_check_server.ts';
import { TokenMappingsMapper } from './mappers/mapping.ts';
import { MetadataMapper } from './mappers/metadata.ts';
import { TransactionMapper } from './mappers/transaction.ts';
import { TokenMappingsService } from './services/mapping.ts';
import { MetadataService } from './services/metadata.ts';
import { TransactionsService } from './services/transaction.ts';

let database: MongoDBClient;

const NETWORK_ID = process.env.NETWORK_ID || '0';
const BRIDGE_SERVICE_URL = process.env.BRIDGE_SERVICE_URL;
const NETWORK = process.env.NETWORK || 'mainnet';
const ETROG_UPDATE_BLOCK_NUMBER = process.env.ETROG_UPDATE_BLOCK_NUMBER || '0';
const METADATA_DOC = process.env.METADATA_DOC || 'lastIndexedTransactions';

async function start(): Promise<void> {
	try {
		const collectionsConfig = COLLECTIONS_CONFIG.get(NETWORK) || COLLECTIONS_CONFIG.get('devnet')!;

		database = new MongoDBClient(
			process.env.MONGODB_CONNECTION_URI || 'mongodb://localhost:27017',
			process.env.MONGODB_DB_NAME || 'bridge_hub'
		);
		await database.connect();

		const transactionService = new TransactionsService(
			database.getCollection(collectionsConfig.transactions)
		);

		const tokenMappingsService = new TokenMappingsService(
			database.getCollection(collectionsConfig.tokenMappings)
		);

		const bridgeAPIConsumer = new BridgeAPIConsumer(
			{
				apiUrl: new URL(`${BRIDGE_SERVICE_URL}/bridges`),
				startCount: { key: 'deposit_count', value: 0 },
				cronExpr: '0/10 * * * * *',
				pollSize: 2,
				method: 'GET',
				params: {
					network_id: NETWORK_ID || '0',
					page_size: '2'
				},
				paginationParam: 'page_number',
				resultPath: 'bridges'
			},
			{
				apiUrl: new URL(`${BRIDGE_SERVICE_URL}/claims`),
				startCount: { key: 'block_num', value: 0 },
				cronExpr: '0/10 * * * * *',
				pollSize: 2,
				method: 'GET',
				params: {
					network_id: NETWORK_ID || '0',
					page_size: '2'
				},
				paginationParam: 'page_number',
				resultPath: 'claims'
			},
			{
				apiUrl: new URL(`${BRIDGE_SERVICE_URL}/token-mappings`),
				startCount: { key: 'block_num', value: 0 },
				cronExpr: '0/10 * * * * *',
				pollSize: 2,
				method: 'GET',
				params: {
					network_id: NETWORK_ID || '0',
					page_size: '2'
				},
				paginationParam: 'page_number',
				resultPath: 'token_mappings'
			},
			new TransactionMapper(Number(NETWORK_ID) || 0, Number(ETROG_UPDATE_BLOCK_NUMBER)),
			new TokenMappingsMapper(Number(NETWORK_ID) || 0),
			new MetadataMapper(),
			transactionService,
			tokenMappingsService,
			new MetadataService(database.getCollection(collectionsConfig.metadata), METADATA_DOC)
		);

		const claimReadinessConsumer = new ClaimReadinessConsumer(
			{
				cronExpr: '0/30 * * * * *',
				networkId: Number(NETWORK_ID) || 0,
				l1InfoTreeIndexUrl: `${BRIDGE_SERVICE_URL}/l1-info-tree-index`,
				injectedL1InfoLeafUrl: `${BRIDGE_SERVICE_URL}/injected-l1-info-leaf`
			},
			transactionService
		);

		await startHealthCheckServer(Number(process.env.HEALTH_CHECK_PORT || '3001'), async () => {
			try {
				// Liveness is gated solely on the DB connection — a
				// round-trip command surfaces a dropped/unauthenticated
				// connection without depending on the RPC node or the
				// Aggkit Bridge Service, neither of which the consumer can
				// keep healthy on its own.
				//
				// Use `hello`, not `ping`: prod runs on Firestore's
				// MongoDB-compatible API, whose supported-command surface
				// omits `ping` (and `serverStatus`) but includes `hello`.
				// `hello` is the canonical driver handshake and is the
				// confirmed-supported lightweight liveness check there.
				// https://docs.cloud.google.com/firestore/mongodb-compatibility/docs/supported-features-80
				await database.getDb().command({ hello: 1 });

				return true;
			} catch (error: any) {
				Logger.info({
					location: 'bridge_api_consumer_index',
					function: 'setupHealthCheckServer',
					status: `ERROR encountered on health check`,
					error: error
				});
				throw error instanceof ApiError ? error : new ApiError(error.message);
			}
		});
		await bridgeAPIConsumer.start();
		await claimReadinessConsumer.start();

		Logger.info(`Consumer for network id ${NETWORK_ID} started`);
	} catch (error) {
		Logger.error(error as Error);
	}
}

await start();
