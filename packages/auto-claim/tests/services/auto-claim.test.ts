import { describe, test, expect, beforeEach, beforeAll, mock } from "bun:test";
import { Logger } from "@polygonlabs/servercore";
import AutoClaimService from "../../src/services/auto-claim";
import TransactionService from "../../src/services/transaction";
import type { WalletClient } from "viem";
import {
	mockTransaction,
	mockTransactionMessage,
	mockTransactionWithoutLeafIndex,
	mockClaimProof,
	createMockFetch,
	mockTransactionResponse,
	mockClaimProofResponse,
} from "../test-utils";

// Mock viem modules
const mockWaitForTransactionReceipt = mock(() =>
	Promise.resolve({
		status: "success",
		transactionHash: "0xtxhash123",
	})
);

const mockGetContract = mock(() => ({
	write: {
		claimAsset: mock(() => Promise.resolve("0xtxhash123" as `0x${string}`)),
		claimMessage: mock(() =>
			Promise.resolve("0xtxhash456" as `0x${string}`)
		),
	},
}));

mock.module("viem/actions", () => ({
	waitForTransactionReceipt: mockWaitForTransactionReceipt,
}));

mock.module("viem", () => ({
	getContract: mockGetContract,
}));

// Initialize Logger for tests
beforeAll(() => {
	Logger.create({});
});

describe("AutoClaimService", () => {
	let service: AutoClaimService;
	let transactionService: TransactionService;
	let mockWalletClient: WalletClient;
	let mockWrite: any;
	const bridgeContractAddress =
		"0x528e26b25a34a4A5d0dbDa1d57D318153d2ED582" as `0x${string}`;
	const bridgeHubAPIUrl = "https://api.test.com";
	const sourceNetworks = "[1]";
	const destinationNetwork = "2442";

	beforeEach(() => {
		// Reset all mocks
		mockWaitForTransactionReceipt.mockClear();
		mockGetContract.mockClear();

		// Mock wallet client
		mockWalletClient = {
			account: {
				address: "0xTestAccount",
			},
			chain: {
				id: 2442,
			},
			transport: {},
			extend: mock(() => mockWalletClient),
		} as any;

		// Setup write methods for this test
		mockWrite = {
			claimAsset: mock(() =>
				Promise.resolve("0xtxhash123" as `0x${string}`)
			),
			claimMessage: mock(() =>
				Promise.resolve("0xtxhash456" as `0x${string}`)
			),
		};

		mockGetContract.mockReturnValue({
			write: mockWrite,
		});

		transactionService = new TransactionService(
			bridgeHubAPIUrl,
			sourceNetworks,
			destinationNetwork
		);

		service = new AutoClaimService(
			bridgeContractAddress,
			mockWalletClient,
			transactionService
		);
	});

	describe("constructor", () => {
		test("should initialize with correct parameters", () => {
			expect(service).toBeInstanceOf(AutoClaimService);
		});
	});

	describe("claimTransactions", () => {
		test("should successfully claim ASSET transactions", async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=43`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).toHaveBeenCalledTimes(1);
			expect(mockWrite.claimMessage).toHaveBeenCalledTimes(1);
		});

		test("should handle transactions without leafIndexForProof", async () => {
			const responseWithoutLeafIndex = {
				success: true,
				data: [mockTransactionWithoutLeafIndex],
				pagination: {
					total: 1,
					limit: 50,
					nextStartAfterCursor: undefined,
				},
			};

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					responseWithoutLeafIndex,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).not.toHaveBeenCalled();
			expect(mockWrite.claimMessage).not.toHaveBeenCalled();
		});

		test("should skip transactions when proof is null", async () => {
			const incompleteProofResponse = {
				success: true,
				data: {
					proof_local_exit_root: undefined,
					proof_rollup_exit_root: undefined,
					l1_info_tree_leaf: {},
					bridge_tx_metadata: "0x",
				},
			};

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					incompleteProofResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=43`,
					incompleteProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).not.toHaveBeenCalled();
			expect(mockWrite.claimMessage).not.toHaveBeenCalled();
		});

		test("should handle empty transaction list", async () => {
			const emptyResponse = {
				success: true,
				data: [],
				pagination: {
					total: 0,
					limit: 50,
					nextStartAfterCursor: undefined,
				},
			};

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					emptyResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).not.toHaveBeenCalled();
			expect(mockWrite.claimMessage).not.toHaveBeenCalled();
		});

		test("should use globalIndex from transaction when available", async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					{
						success: true,
						data: [mockTransaction],
						pagination: {
							total: 1,
							limit: 50,
							nextStartAfterCursor: undefined,
						},
					},
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).toHaveBeenCalledTimes(1);
			// Verify it was called with the global index from the transaction
			const callArgs = mockWrite.claimAsset.mock.calls[0];
			expect(callArgs[2]).toBe(123456789n);
		});

		test("should compute globalIndex when not in transaction", async () => {
			const txWithoutGlobalIndex = {
				...mockTransaction,
				globalIndex: undefined,
			};

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					{
						success: true,
						data: [txWithoutGlobalIndex],
						pagination: {
							total: 1,
							limit: 50,
							nextStartAfterCursor: undefined,
						},
					},
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).toHaveBeenCalledTimes(1);
		});

		test("should continue processing after individual transaction error", async () => {
			mockWrite.claimAsset.mockRejectedValueOnce(
				new Error("Transaction failed")
			);

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=43`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).toHaveBeenCalledTimes(1);
			expect(mockWrite.claimMessage).toHaveBeenCalledTimes(1);
		});

		test("should handle errors from getPendingTransactions gracefully", async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					new Error("API unavailable"),
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			// The service catches the error and returns empty array, so no exception is thrown
			await service.claimTransactions();

			expect(mockWrite.claimAsset).not.toHaveBeenCalled();
			expect(mockWrite.claimMessage).not.toHaveBeenCalled();
		});
	});

	describe("sendTransaction", () => {
		test("should call claimAsset with correct parameters for ASSET type", async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					{
						success: true,
						data: [mockTransaction],
						pagination: {
							total: 1,
							limit: 50,
							nextStartAfterCursor: undefined,
						},
					},
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).toHaveBeenCalledTimes(1);

			const callArgs = mockWrite.claimAsset.mock.calls[0] as any;
			expect(callArgs[0]).toEqual(mockClaimProof.proof_local_exit_root);
			expect(callArgs[1]).toEqual(mockClaimProof.proof_rollup_exit_root);
			expect(callArgs[2]).toBe(123456789n);
			expect(callArgs[3]).toBe(
				mockClaimProof.l1_info_tree_leaf.mainnet_exit_root
			);
			expect(callArgs[4]).toBe(
				mockClaimProof.l1_info_tree_leaf.rollup_exit_root
			);
			expect(callArgs[5]).toBe(mockTransaction.originTokenNetwork);
			expect(callArgs[6]).toBe(mockTransaction.originTokenAddress);
			expect(callArgs[7]).toBe(mockTransaction.destinationNetwork);
			expect(callArgs[8]).toBe(mockTransaction.receiverAddress);
			expect(callArgs[9]).toBe(BigInt(mockTransaction.amount));
			expect(callArgs[10]).toBe(mockClaimProof.bridge_tx_metadata);
		});

		test("should call claimMessage with correct parameters for MESSAGE type", async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					{
						success: true,
						data: [mockTransactionMessage],
						pagination: {
							total: 1,
							limit: 50,
							nextStartAfterCursor: undefined,
						},
					},
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=43`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimMessage).toHaveBeenCalledTimes(1);

			const callArgs = mockWrite.claimMessage.mock.calls[0] as any;
			expect(callArgs[0]).toEqual(mockClaimProof.proof_local_exit_root);
			expect(callArgs[1]).toEqual(mockClaimProof.proof_rollup_exit_root);
		});

		test("should return false when transaction write fails", async () => {
			mockWrite.claimAsset.mockRejectedValueOnce(
				new Error("Transaction execution failed")
			);

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					{
						success: true,
						data: [mockTransaction],
						pagination: {
							total: 1,
							limit: 50,
							nextStartAfterCursor: undefined,
						},
					},
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).toHaveBeenCalledTimes(1);
		});
	});

	describe("integration scenarios", () => {
		test("should handle complete claim flow with multiple transactions", async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=43`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).toHaveBeenCalledTimes(1);
			expect(mockWrite.claimMessage).toHaveBeenCalledTimes(1);
		});

		test("should handle mixed success and failure scenarios", async () => {
			mockWrite.claimAsset.mockResolvedValueOnce("0xtxhash1");
			mockWrite.claimMessage.mockRejectedValueOnce(
				new Error("Gas estimation failed")
			);

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=43`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).toHaveBeenCalledTimes(1);
			expect(mockWrite.claimMessage).toHaveBeenCalledTimes(1);
		});

		test("should handle pagination in transaction fetching", async () => {
			const firstPageResponse = {
				success: true,
				data: [mockTransaction],
				pagination: {
					total: 2,
					limit: 50,
					nextStartAfterCursor: "cursor-123",
				},
			};

			const secondPageResponse = {
				success: true,
				data: [mockTransactionMessage],
				pagination: {
					total: 2,
					limit: 50,
					nextStartAfterCursor: undefined,
				},
			};

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					firstPageResponse,
				],
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50&startAfter=cursor-123`,
					secondPageResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=43`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimAsset).toHaveBeenCalledTimes(1);
			expect(mockWrite.claimMessage).toHaveBeenCalledTimes(1);
		});
	});

	describe("error handling", () => {
		test("should log errors but not stop processing other transactions", async () => {
			mockWrite.claimAsset.mockRejectedValueOnce(
				new Error("Nonce too low")
			);

			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					mockTransactionResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=42`,
					mockClaimProofResponse,
				],
				[
					`${bridgeHubAPIUrl}/claim-proof?sourceNetworkId=1&leafIndex=10&depositCount=43`,
					mockClaimProofResponse,
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			await service.claimTransactions();

			expect(mockWrite.claimMessage).toHaveBeenCalledTimes(1);
		});

		test("should handle network errors gracefully", async () => {
			const responses = new Map([
				[
					`${bridgeHubAPIUrl}/transactions?destinationNetworkIds=${destinationNetwork}&sourceNetworkIds=1&status=READY_TO_CLAIM&limit=50`,
					new Error("Network timeout"),
				],
			]);

			globalThis.fetch = createMockFetch(responses);

			// Service catches errors gracefully and completes without throwing
			await service.claimTransactions();

			// No transactions should be claimed due to the error
			expect(mockWrite.claimAsset).not.toHaveBeenCalled();
			expect(mockWrite.claimMessage).not.toHaveBeenCalled();
		});
	});
});
