import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import TransactionsService from "../../src/services/transaction";
import { TransactionStatus } from "@agglayer/bridge-hub-commons";
import type {
	IHubBridgeTransaction,
	IHubBridgedStatusTransactions,
	IHubLeafIncludedStatusTransactions,
} from "../../src/interfaces/bridge_tx";
import type { IHubClaimTransaction } from "../../src/interfaces/claim_tx";

const mockConditionalUpdateDocuments = mock((_params: any) => {});
const mockUpdateDocuments = mock((_params: any) => {});
const mockGetDocuments = mock((_params: any) =>
	Promise.resolve({ documents: [] })
);

const mockDatabase = {
	conditionalUpdateDocuments: mockConditionalUpdateDocuments,
	updateDocuments: mockUpdateDocuments,
	getDocuments: mockGetDocuments,
} as unknown as DatabaseClient;

describe("TransactionsService", () => {
	let service: TransactionsService;
	const mockCollectionId = "test_transactions";

	beforeEach(() => {
		service = new TransactionsService(mockDatabase, mockCollectionId);
		mockConditionalUpdateDocuments.mockClear();
		mockUpdateDocuments.mockClear();
		mockGetDocuments.mockClear();
	});

	describe("constructor", () => {
		test("should initialize with default collection ID", () => {
			const defaultService = new TransactionsService(mockDatabase);
			expect(defaultService).toBeInstanceOf(TransactionsService);
		});

		test("should initialize with custom collection ID", () => {
			const customService = new TransactionsService(
				mockDatabase,
				"custom_collection"
			);
			expect(customService).toBeInstanceOf(TransactionsService);
		});
	});

	describe("generateDocId", () => {
		test("should generate consistent document ID for same inputs", async () => {
			const bridgeTransaction1: IHubBridgeTransaction = {
				hubUID: "test-uid-1",
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash1",
				leafType: "ASSET",
				originTokenNetwork: 1,
				originTokenAddress: "0xorigin1",
				sourceNetwork: 1,
				destinationNetwork: 137,
				receiverAddress: "0xreceiver1",
				fromAddress: "0xfrom1",
				amount: 1000,
				depositCount: 42,
				bridgeHash: "0xbridge1",
				status: TransactionStatus.BRIDGED,
				lastUpdatedAt: Date.now(),
			};

			const bridgeTransaction2: IHubBridgeTransaction = {
				...bridgeTransaction1,
				hubUID: "test-uid-2", // Different hubUID
				blockNumber: 200, // Different block
				transactionHash: "0xhash2", // Different hash
				// but same depositCount and sourceNetwork
			};

			await service.saveBridges([bridgeTransaction1]);
			await service.saveBridges([bridgeTransaction2]);

			const firstCall = mockConditionalUpdateDocuments.mock.calls[0]?.[0];
			const secondCall =
				mockConditionalUpdateDocuments.mock.calls[1]?.[0];

			// Should generate same docId for same depositCount and sourceNetwork
			expect(firstCall?.docIds[0]).toBe(secondCall?.docIds[0]);
		});

		test("should generate different document IDs for different key inputs", async () => {
			const bridgeTransaction1: IHubBridgeTransaction = {
				hubUID: "test-uid-1",
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash1",
				leafType: "ASSET",
				originTokenNetwork: 1,
				originTokenAddress: "0xorigin1",
				sourceNetwork: 1,
				destinationNetwork: 137,
				receiverAddress: "0xreceiver1",
				fromAddress: "0xfrom1",
				amount: 1000,
				depositCount: 42,
				bridgeHash: "0xbridge1",
				status: TransactionStatus.BRIDGED,
				lastUpdatedAt: Date.now(),
			};

			const bridgeTransaction2: IHubBridgeTransaction = {
				...bridgeTransaction1,
				depositCount: 43, // Different depositCount
			};

			await service.saveBridges([bridgeTransaction1]);
			await service.saveBridges([bridgeTransaction2]);

			const firstCall = mockConditionalUpdateDocuments.mock.calls[0]?.[0];
			const secondCall =
				mockConditionalUpdateDocuments.mock.calls[1]?.[0];

			// Should generate different docIds for different depositCount
			expect(firstCall?.docIds[0]).not.toBe(secondCall?.docIds[0]);
		});
	});

	describe("saveBridges", () => {
		test("should save empty array without error", async () => {
			await service.saveBridges([]);

			expect(mockConditionalUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: mockCollectionId,
				docDatas: [],
				docIds: [],
				conditions: [
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.BRIDGED,
					},
				],
				conditionModifications: [
					{
						field: "status",
						value: TransactionStatus.BRIDGED,
						defaultValue: TransactionStatus.BRIDGED,
					},
				],
			});
		});

		test("should save single bridge transaction", async () => {
			const bridgeTransaction: IHubBridgeTransaction = {
				hubUID: "test-uid",
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash",
				leafType: "ASSET",
				originTokenNetwork: 1,
				originTokenAddress: "0xorigin",
				sourceNetwork: 1,
				destinationNetwork: 137,
				receiverAddress: "0xreceiver",
				fromAddress: "0xfrom",
				amount: 1000,
				depositCount: 42,
				bridgeHash: "0xbridge",
				status: TransactionStatus.BRIDGED,
				lastUpdatedAt: Date.now(),
			};

			await service.saveBridges([bridgeTransaction]);

			expect(mockConditionalUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: mockCollectionId,
				docDatas: [bridgeTransaction],
				docIds: expect.arrayContaining([expect.any(String)]),
				conditions: [
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.BRIDGED,
					},
				],
				conditionModifications: [
					{
						field: "status",
						value: TransactionStatus.BRIDGED,
						defaultValue: TransactionStatus.BRIDGED,
					},
				],
			});

			const call = mockConditionalUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docIds).toHaveLength(1);
			expect(call?.docIds[0]).toMatch(/^[a-f0-9]{32}$/);
		});

		test("should save multiple bridge transactions", async () => {
			const bridgeTransactions: IHubBridgeTransaction[] = [
				{
					hubUID: "test-uid-1",
					blockNumber: 100,
					transactionIndex: 1,
					timestamp: 1700000000,
					transactionHash: "0xhash1",
					leafType: "ASSET",
					originTokenNetwork: 1,
					originTokenAddress: "0xorigin1",
					sourceNetwork: 1,
					destinationNetwork: 137,
					receiverAddress: "0xreceiver1",
					fromAddress: "0xfrom1",
					amount: 1000,
					depositCount: 42,
					bridgeHash: "0xbridge1",
					status: TransactionStatus.BRIDGED,
					lastUpdatedAt: Date.now(),
				},
				{
					hubUID: "test-uid-2",
					blockNumber: 101,
					transactionIndex: 2,
					timestamp: 1700001000,
					transactionHash: "0xhash2",
					leafType: "MESSAGE",
					originTokenNetwork: 2,
					originTokenAddress: "0xorigin2",
					sourceNetwork: 1,
					destinationNetwork: 137,
					receiverAddress: "0xreceiver2",
					fromAddress: "0xfrom2",
					amount: 2000,
					depositCount: 43,
					bridgeHash: "0xbridge2",
					status: TransactionStatus.BRIDGED,
					lastUpdatedAt: Date.now(),
				},
			];

			await service.saveBridges(bridgeTransactions);

			const call = mockConditionalUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docDatas).toBe(bridgeTransactions);
			expect(call?.docIds).toHaveLength(2);
			expect(call?.docIds[0]).not.toBe(call?.docIds[1]);
		});
	});

	describe("saveClaims", () => {
		test("should save empty array without error", async () => {
			await service.saveClaims([]);

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: mockCollectionId,
				docDatas: [],
				docIds: [],
			});
		});

		test("should save single claim transaction", async () => {
			const claimTransaction: IHubClaimTransaction = {
				claimTransactionHash: "0xclaimhash",
				claimBlockNumber: 200,
				claimTimestamp: 1700002000,
				globalIndex: 123456789,
				sourceNetwork: 1,
				depositCount: 42,
				status: TransactionStatus.CLAIMED,
				lastUpdatedAt: Date.now(),
			};

			await service.saveClaims([claimTransaction]);

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: mockCollectionId,
				docDatas: [claimTransaction],
				docIds: expect.arrayContaining([expect.any(String)]),
			});

			const call = mockUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docIds).toHaveLength(1);
			expect(call?.docIds[0]).toMatch(/^[a-f0-9]{32}$/);
		});

		test("should save multiple claim transactions", async () => {
			const claimTransactions: IHubClaimTransaction[] = [
				{
					claimTransactionHash: "0xclaimhash1",
					claimBlockNumber: 200,
					claimTimestamp: 1700002000,
					globalIndex: 123456789,
					sourceNetwork: 1,
					depositCount: 42,
					status: TransactionStatus.CLAIMED,
					lastUpdatedAt: Date.now(),
				},
				{
					claimTransactionHash: "0xclaimhash2",
					claimBlockNumber: 201,
					claimTimestamp: 1700003000,
					globalIndex: 987654321,
					sourceNetwork: 2,
					depositCount: 43,
					status: TransactionStatus.CLAIMED,
					lastUpdatedAt: Date.now(),
				},
			];

			await service.saveClaims(claimTransactions);

			const call = mockUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docDatas).toBe(claimTransactions);
			expect(call?.docIds).toHaveLength(2);
			expect(call?.docIds[0]).not.toBe(call?.docIds[1]);
		});
	});

	describe("updateLeafIndex", () => {
		test("should update leaf index correctly", async () => {
			const depositCount = 42;
			const sourceNetwork = 1;
			const leafIndex = 100;

			await service.updateLeafIndex(
				depositCount,
				sourceNetwork,
				leafIndex
			);

			expect(mockConditionalUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: mockCollectionId,
				docDatas: [{ leafIndex, lastUpdatedAt: expect.any(Number) }],
				docIds: [expect.any(String)],
				conditions: [
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.BRIDGED,
					},
				],
				conditionModifications: [
					{
						field: "status",
						value: TransactionStatus.LEAF_INCLUDED,
						defaultValue: TransactionStatus.LEAF_INCLUDED,
					},
				],
			});

			const call = mockConditionalUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docIds[0]).toMatch(/^[a-f0-9]{32}$/);
			expect(call?.docDatas[0].leafIndex).toBe(leafIndex);
			expect(call?.docDatas[0].lastUpdatedAt).toBeTypeOf("number");
		});

		test("should generate timestamp within reasonable range", async () => {
			const beforeExecution = Date.now();
			await service.updateLeafIndex(42, 1, 100);
			const afterExecution = Date.now();

			const call = mockConditionalUpdateDocuments.mock.calls[0]?.[0];
			const timestamp = call?.docDatas[0].lastUpdatedAt;

			expect(timestamp).toBeGreaterThanOrEqual(beforeExecution);
			expect(timestamp).toBeLessThanOrEqual(afterExecution);
		});
	});

	describe("updateTransactionToReadyToClaim", () => {
		test("should update transaction to ready to claim", async () => {
			const depositCount = 42;
			const sourceNetwork = 1;

			await service.updateTransactionToReadyToClaim(
				depositCount,
				sourceNetwork
			);

			expect(mockConditionalUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: mockCollectionId,
				docDatas: [{ lastUpdatedAt: expect.any(Number) }],
				docIds: [expect.any(String)],
				conditions: [
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.LEAF_INCLUDED,
					},
				],
				conditionModifications: [
					{
						field: "status",
						value: TransactionStatus.READY_TO_CLAIM,
						defaultValue: TransactionStatus.READY_TO_CLAIM,
					},
				],
			});

			const call = mockConditionalUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docIds[0]).toMatch(/^[a-f0-9]{32}$/);
			expect(call?.docDatas[0].lastUpdatedAt).toBeTypeOf("number");
		});
	});

	describe("getBridgedTransactions", () => {
		test("should get bridged transactions without cursor", async () => {
			const sourceNetwork = 1;
			const mockTransactions: IHubBridgedStatusTransactions[] = [
				{
					sourceNetwork: 1,
					depositCount: 42,
					hubUID: "hub-123",
				},
			];

			mockGetDocuments.mockResolvedValueOnce({
				documents: mockTransactions as any,
			});

			const result = await service.getBridgedTransactions(sourceNetwork);

			expect(mockGetDocuments).toHaveBeenCalledWith({
				collectionPath: mockCollectionId,
				filter: [
					{
						field: "sourceNetwork",
						operator: "==",
						value: sourceNetwork,
					},
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.BRIDGED,
					},
				],
				limit: 10,
				order: [{ field: "hubUID", order: "asc" }],
				startAfterCursor: undefined,
				selectFields: ["sourceNetwork", "depositCount", "hubUID"],
			});

			expect(result).toBe(mockTransactions);
		});

		test("should get bridged transactions with cursor", async () => {
			const sourceNetwork = 1;
			const afterId = "cursor-123";
			const mockTransactions: IHubBridgedStatusTransactions[] = [];

			mockGetDocuments.mockResolvedValueOnce({
				documents: mockTransactions as any,
			});

			const result = await service.getBridgedTransactions(
				sourceNetwork,
				afterId
			);

			expect(mockGetDocuments).toHaveBeenCalledWith({
				collectionPath: mockCollectionId,
				filter: [
					{
						field: "sourceNetwork",
						operator: "==",
						value: sourceNetwork,
					},
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.BRIDGED,
					},
				],
				limit: 10,
				order: [{ field: "hubUID", order: "asc" }],
				startAfterCursor: afterId,
				selectFields: ["sourceNetwork", "depositCount", "hubUID"],
			});

			expect(result).toBe(mockTransactions);
		});
	});

	describe("getLeafIncludedTransactions", () => {
		test("should get leaf included transactions without cursor", async () => {
			const destinationNetwork = 137;
			const mockTransactions: IHubLeafIncludedStatusTransactions[] = [
				{
					sourceNetwork: 1,
					depositCount: 42,
					leafIndex: 100,
					hubUID: "hub-123",
				},
			];

			mockGetDocuments.mockResolvedValueOnce({
				documents: mockTransactions as any,
			});

			const result =
				await service.getLeafIncludedTransactions(destinationNetwork);

			expect(mockGetDocuments).toHaveBeenCalledWith({
				collectionPath: mockCollectionId,
				filter: [
					{
						field: "destinationNetwork",
						operator: "==",
						value: destinationNetwork,
					},
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.LEAF_INCLUDED,
					},
				],
				limit: 10,
				order: [{ field: "hubUID", order: "asc" }],
				startAfterCursor: undefined,
				selectFields: [
					"sourceNetwork",
					"depositCount",
					"leafIndex",
					"hubUID",
				],
			});

			expect(result).toBe(mockTransactions);
		});

		test("should get leaf included transactions with cursor", async () => {
			const destinationNetwork = 137;
			const afterId = "cursor-456";

			mockGetDocuments.mockResolvedValueOnce({ documents: [] });

			await service.getLeafIncludedTransactions(
				destinationNetwork,
				afterId
			);

			expect(mockGetDocuments).toHaveBeenCalledWith({
				collectionPath: mockCollectionId,
				filter: [
					{
						field: "destinationNetwork",
						operator: "==",
						value: destinationNetwork,
					},
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.LEAF_INCLUDED,
					},
				],
				limit: 10,
				order: [{ field: "hubUID", order: "asc" }],
				startAfterCursor: afterId,
				selectFields: [
					"sourceNetwork",
					"depositCount",
					"leafIndex",
					"hubUID",
				],
			});
		});
	});

	describe("edge cases", () => {
		test("should handle zero deposit count", async () => {
			await service.updateLeafIndex(0, 1, 50);

			const call = mockConditionalUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docIds[0]).toMatch(/^[a-f0-9]{32}$/);
		});

		test("should handle large network IDs", async () => {
			const largeNetworkId = 999999999;
			await service.updateTransactionToReadyToClaim(42, largeNetworkId);

			expect(mockConditionalUpdateDocuments).toHaveBeenCalledTimes(1);
		});

		test("should handle negative leaf index", async () => {
			await service.updateLeafIndex(42, 1, -1);

			const call = mockConditionalUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docDatas[0].leafIndex).toBe(-1);
		});
	});
});
