import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

import { Logger } from '@polygonlabs/servercore';

import { AutoClaimService } from './services/auto-claim.ts';
import { TransactionService } from './services/transaction.ts';

Logger.create({
	sentry: {
		dsn: process.env.SENTRY_DSN,
		level: 'error'
	},
	console: {
		level: 'debug'
	}
});

let autoClaimService: AutoClaimService;

const POLL_INTERVAL = 30000; // 30 seconds

// Consecutive claim-proof/claim failures before a transaction is skipped by the circuit
// breaker, and how many ticks it stays skipped before one retry attempt is allowed. See
// ClaimCircuitBreaker for why this exists.
const CLAIM_FAILURE_THRESHOLD = Number(process.env.AUTO_CLAIM_FAILURE_THRESHOLD) || 15;
const CLAIM_RETRY_WINDOW_TICKS = Number(process.env.AUTO_CLAIM_RETRY_WINDOW_TICKS) || 120;
async function run() {
	while (true) {
		try {
			await autoClaimService.claimTransactions();
		} catch (error: any) {
			Logger.error({ error, message: 'Error claiming transactions' });
		}
		await new Promise((r) => setTimeout(r, POLL_INTERVAL));
	}
}

async function start() {
	try {
		const rawRPCConfig = JSON.parse(process.env.RPC_CONFIG || '{}');
		const providerURL =
			rawRPCConfig[process.env.DESTINATION_NETWORK_CHAINID as string] ||
			`${process.env.BASE_ERPC_URL}/${process.env.DESTINATION_NETWORK_CHAINID as string}?token=${process.env.ERPC_API_KEY}`;

		const account = privateKeyToAccount(process.env.PRIVATE_KEY as `0x${string}`);
		const wallet = createWalletClient({
			account,
			transport: http(providerURL)
		});

		const transactionService = new TransactionService(
			process.env.BRIDGE_HUB_API_URL as string,
			process.env.SOURCE_NETWORKS as string,
			process.env.DESTINATION_NETWORK as string
		);

		autoClaimService = new AutoClaimService(
			process.env.BRIDGE_CONTRACT as `0x${string}`,
			wallet,
			transactionService,
			{
				failureThreshold: CLAIM_FAILURE_THRESHOLD,
				retryWindowTicks: CLAIM_RETRY_WINDOW_TICKS
			}
		);

		void run();
	} catch (error: any) {
		Logger.error({ location: 'index.start', message: 'auto-claim service failed to start', error });
	}
}

await start();
