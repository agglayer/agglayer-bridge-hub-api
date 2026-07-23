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
			transactionService
		);

		void run();
	} catch (error: any) {
		Logger.error({ location: 'index.start', error });
	}
}

await start();
