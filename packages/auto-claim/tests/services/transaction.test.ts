import { describe, test, expect, beforeEach, beforeAll, vi } from 'vitest';

import { Logger } from '@polygonlabs/servercore';

import { TransactionService } from '../../src/services/transaction.ts';
import {
	mockTransaction,
	mockTransactionMessage,
	mockClaimProofResponse,
	mockTransactionResponse,
	mockTransactionResponseWithPagination,
	mockEmptyTransactionResponse,
	createMockFetch
} from '../test-utils.ts';

// Initialize Logger for tests
beforeAll(() => {
	Logger.create({});
});

describe('TransactionService', () => {
	let service: TransactionService;
	const bridgeHubAPIUrl = 'https://api.test.com';
	const sourceNetworks = '[1, 137]';
	const destinationNetwork = '2442';

	beforeEach(() => {
		service = new TransactionService(bridgeHubAPIUrl, sourceNetworks, destinationNetwork);
	});

	describe('constructor', () => {
		test('should initialize with correct parameters', () => {
			const customService = new TransactionService('https://custom.api.com', '[1]', '137');
			expect(customService).toBeInstanceOf(TransactionService);
		});
	});

	describe('getPendingTransactions', () => {
		test('should fetch and return pending transactions', async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await service.getPendingTransactions();

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual(mockTransaction);
			expect(result[1]).toEqual(mockTransactionMessage);
		});

		test('should handle pagination correctly', async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponseWithPagination
				],
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50&startAfter=test-hub-uid-123`,
					mockTransactionResponse
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await service.getPendingTransactions();

			expect(result).toHaveLength(3);
		});

		test('should return empty array when no transactions found', async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					mockEmptyTransactionResponse
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await service.getPendingTransactions();

			expect(result).toHaveLength(0);
		});

		test('should filter out MESSAGE transactions with amount 0', async () => {
			const transactionWithZeroAmount = {
				...mockTransactionMessage,
				amount: '0'
			};
			const responseWithZeroAmount = {
				data: [mockTransaction, transactionWithZeroAmount],
				pagination: {
					totalDocumentCount: 2,
					nextStartAfterCursor: undefined
				}
			};

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					responseWithZeroAmount
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await service.getPendingTransactions();

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual(mockTransaction);
		});

		test('should handle fetch errors gracefully', async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					new Error('Network error')
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await service.getPendingTransactions();

			expect(result).toHaveLength(0);
		});

		test('should format source network IDs correctly', async () => {
			const singleNetworkService = new TransactionService(
				bridgeHubAPIUrl,
				'[1]',
				destinationNetwork
			);

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await singleNetworkService.getPendingTransactions();

			expect(result).toHaveLength(2);
		});

		test('should handle multiple source networks', async () => {
			const multiNetworkService = new TransactionService(
				bridgeHubAPIUrl,
				'[1, 137, 42]',
				destinationNetwork
			);

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137,42&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await multiNetworkService.getPendingTransactions();

			expect(result).toHaveLength(2);
		});
	});

	describe('getProof', () => {
		test('should fetch and return valid proof', async () => {
			const sourceNetwork = 1;
			const depositCount = 42;
			const leafIndex = 10;

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=${sourceNetwork}&leafIndex=${leafIndex}&depositCount=${depositCount}`,
					mockClaimProofResponse
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await service.getProof(sourceNetwork, depositCount, leafIndex);

			expect(result).not.toBeNull();
			expect(result?.proof_local_exit_root).toBeDefined();
			expect(result?.proof_rollup_exit_root).toBeDefined();
			expect(result?.l1_info_tree_leaf).toBeDefined();
		});

		test('should return null when proof is incomplete', async () => {
			const incompleteProof = {
				data: {
					proof_local_exit_root: undefined,
					proof_rollup_exit_root: undefined,
					l1_info_tree_leaf: {},
					bridge_tx_metadata: '0x'
				}
			};

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					incompleteProof
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await service.getProof(1, 42, 10);

			expect(result).toBeNull();
		});

		test('should handle fetch errors gracefully', async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					new Error('Network error')
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const result = await service.getProof(1, 42, 10);

			expect(result).toBeNull();
		});

		test('should handle various network and deposit count values', async () => {
			const testCases = [
				{ sourceNetwork: 0, depositCount: 0, leafIndex: 0 },
				{ sourceNetwork: 1, depositCount: 1, leafIndex: 1 },
				{ sourceNetwork: 137, depositCount: 999999, leafIndex: 50 }
			];

			for (const { sourceNetwork, depositCount, leafIndex } of testCases) {
				const responses = new Map([
					[
						`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=${sourceNetwork}&leafIndex=${leafIndex}&depositCount=${depositCount}`,
						mockClaimProofResponse
					]
				]);

				globalThis.fetch = createMockFetch(responses);

				const result = await service.getProof(sourceNetwork, depositCount, leafIndex);

				expect(result).not.toBeNull();
			}
		});
	});

	describe('computeGlobalIndex', () => {
		test('should compute global index for mainnet (network 0)', () => {
			const indexLocal = 100;
			const sourceNetworkId = 0;

			const result = service.computeGlobalIndex(indexLocal, sourceNetworkId);

			// For mainnet: indexLocal + 2^64
			const expected = BigInt(indexLocal) + BigInt(2 ** 64);
			expect(result).toBe(expected);
		});

		test('should compute global index for non-mainnet networks', () => {
			const indexLocal = 100;
			const sourceNetworkId = 1;

			const result = service.computeGlobalIndex(indexLocal, sourceNetworkId);

			// For non-mainnet: indexLocal + (networkId - 1) * 2^32
			const expected = BigInt(indexLocal) + BigInt(sourceNetworkId - 1) * BigInt(2 ** 32);
			expect(result).toBe(expected);
		});

		test('should handle different network IDs correctly', () => {
			const testCases = [
				{ indexLocal: 0, sourceNetworkId: 0 },
				{ indexLocal: 1, sourceNetworkId: 1 },
				{ indexLocal: 100, sourceNetworkId: 137 },
				{ indexLocal: 999999, sourceNetworkId: 42 }
			];

			for (const { indexLocal, sourceNetworkId } of testCases) {
				const result = service.computeGlobalIndex(indexLocal, sourceNetworkId);

				expect(typeof result).toBe('bigint');
				expect(result).toBeGreaterThanOrEqual(BigInt(0));
			}
		});

		test('should produce different results for different networks', () => {
			const indexLocal = 100;
			const mainnetResult = service.computeGlobalIndex(indexLocal, 0);
			const network1Result = service.computeGlobalIndex(indexLocal, 1);
			const network137Result = service.computeGlobalIndex(indexLocal, 137);

			expect(mainnetResult).not.toBe(network1Result);
			expect(mainnetResult).not.toBe(network137Result);
			expect(network1Result).not.toBe(network137Result);
		});

		test('should handle large index values', () => {
			const largeIndex = 999999999;
			const sourceNetworkId = 137;

			const result = service.computeGlobalIndex(largeIndex, sourceNetworkId);

			expect(typeof result).toBe('bigint');
			expect(result).toBeGreaterThan(BigInt(largeIndex));
		});

		test('should be deterministic for same inputs', () => {
			const indexLocal = 42;
			const sourceNetworkId = 1;

			const result1 = service.computeGlobalIndex(indexLocal, sourceNetworkId);
			const result2 = service.computeGlobalIndex(indexLocal, sourceNetworkId);

			expect(result1).toBe(result2);
		});
	});

	describe('integration scenarios', () => {
		test('should handle complete transaction claiming flow', async () => {
			const responses = new Map<string, any>([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			// Get pending transactions
			const transactions = await service.getPendingTransactions();
			expect(transactions).toHaveLength(2);

			// Get proof for first transaction
			const transaction = transactions[0];
			const proof = await service.getProof(
				transaction.sourceNetwork,
				transaction.depositCount,
				transaction.leafIndexForProof!
			);
			expect(proof).not.toBeNull();

			// Compute global index
			const globalIndex = service.computeGlobalIndex(
				transaction.depositCount,
				transaction.sourceNetwork
			);
			expect(typeof globalIndex).toBe('bigint');
		});

		test('should handle empty transaction list gracefully', async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					mockEmptyTransactionResponse
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const transactions = await service.getPendingTransactions();
			expect(transactions).toHaveLength(0);
		});
	});

	describe('error handling', () => {
		test('should continue processing after proof fetch error', async () => {
			const responses = new Map<string, any>([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					new Error('Proof service unavailable')
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			const transactions = await service.getPendingTransactions();
			expect(transactions).toHaveLength(2);

			const proof = await service.getProof(1, 42, 10);
			expect(proof).toBeNull();
		});

		test('should handle malformed API responses', async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					// Malformed response - missing 'data' field
					{ invalid: 'response', success: false }
				]
			]);

			globalThis.fetch = createMockFetch(responses);

			// Service handles malformed response and exits loop gracefully
			const result = await service.getPendingTransactions();
			expect(result).toHaveLength(0);
		});
	});

	describe('logging', () => {
		// Every Logger call in the package must carry an explicit `message` — prior to this,
		// log lines rendered with an empty message, making them unreadable in Datadog.
		test('getProof logs an explicit message on fetch failure', async () => {
			const errorSpy = vi.spyOn(Logger, 'error');

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					new Error('Network error')
				]
			]);
			globalThis.fetch = createMockFetch(responses);

			await service.getProof(1, 42, 10);

			expect(errorSpy).toHaveBeenCalled();
			const loggedArg = errorSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;
			expect(loggedArg).property('message').a('string');

			errorSpy.mockRestore();
		});

		test('getPendingTransactions logs an explicit message on success', async () => {
			const infoSpy = vi.spyOn(Logger, 'info');

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1,137&status=READY_TO_CLAIM&limit=50`,
					mockEmptyTransactionResponse
				]
			]);
			globalThis.fetch = createMockFetch(responses);

			await service.getPendingTransactions();

			expect(infoSpy).toHaveBeenCalled();
			const loggedArg = infoSpy.mock.calls.at(-1)?.[0] as Record<string, unknown>;
			expect(loggedArg).property('message').a('string');

			infoSpy.mockRestore();
		});
	});
});
