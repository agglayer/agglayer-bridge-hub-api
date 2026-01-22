import { describe, test, expect, beforeEach, mock, beforeAll } from "bun:test";
import { Logger } from "@polygonlabs/servercore";
import TransactionsService from "../../src/services/transaction";
import { TransactionStatus } from "@agglayer/bridge-hub-commons";
import type {
	IHubBridgeTransaction,
	IHubBridgedStatusTransactions,
	IHubLeafIncludedStatusTransactions,
} from "../../src/interfaces/bridge_tx";
import type { IHubClaimTransaction } from "../../src/interfaces/claim_tx";

// Initialize Logger for tests
beforeAll(() => {
	Logger.create({});
});

const mockBulkWrite = mock((_operations: any) => Promise.resolve({}));
const mockUpdateOne = mock((_filter: any, _update: any) => Promise.resolve({}));
const mockFind = mock(() => ({
	find: () => ({
		sort: () => ({
			limit: () => ({
				toArray: () => Promise.resolve([]),
			}),
		}),
	}),
}));
const mockFindOne = mock((_filter: any) => Promise.resolve(null));

const mockCollection = {
	bulkWrite: mockBulkWrite,
	updateOne: mockUpdateOne,
	find: mockFind as any,
	findOne: mockFindOne,
	collectionName: "test_transactions",
	dbName: "test_db",
} as any;

describe("TransactionsService", () => {
	let service: TransactionsService;
	const mockCollectionId = "test_transactions";

	beforeEach(() => {
		service = new TransactionsService(mockCollection, mockCollectionId);
		mockBulkWrite.mockClear();
		mockUpdateOne.mockClear();
		mockFind.mockClear();
		mockFindOne.mockClear();
	});

	describe("constructor", () => {
		test("should initialize with default collection ID", () => {
			const defaultService = new TransactionsService(mockCollection);
			expect(defaultService).toBeInstanceOf(TransactionsService);
		});

		test("should initialize with custom collection ID", () => {
			const customService = new TransactionsService(
				mockCollection,
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
				txSender: "0xsender1",
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

			const firstCall = mockBulkWrite.mock.calls[0]?.[0];
			const secondCall = mockBulkWrite.mock.calls[1]?.[0];

			// Should generate same docId for same depositCount and sourceNetwork
			const firstId = firstCall[0]?.updateOne?.filter?._id;
			const secondId = secondCall[0]?.updateOne?.filter?._id;
			expect(firstId).toBe(secondId);
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
				txSender: "0xsender1",
			};

			const bridgeTransaction2: IHubBridgeTransaction = {
				...bridgeTransaction1,
				depositCount: 43, // Different depositCount
			};

			await service.saveBridges([bridgeTransaction1]);
			await service.saveBridges([bridgeTransaction2]);

			const firstCall = mockBulkWrite.mock.calls[0]?.[0];
			const secondCall = mockBulkWrite.mock.calls[1]?.[0];

			// Should generate different docIds for different depositCount
			const firstId = firstCall[0]?.updateOne?.filter?._id;
			const secondId = secondCall[0]?.updateOne?.filter?._id;
			expect(firstId).not.toBe(secondId);
		});
	});

	describe("saveBridges", () => {
		test("should save empty array without error", async () => {
			await service.saveBridges([]);

			expect(mockBulkWrite).toHaveBeenCalledWith([]);
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
				txSender: "0xsender",
			};

			await service.saveBridges([bridgeTransaction]);

			expect(mockBulkWrite).toHaveBeenCalled();
			const call = mockBulkWrite.mock.calls[0]?.[0];
			expect(call).toHaveLength(1);
			expect(call[0]).toHaveProperty("updateOne");

			const docId = call[0]?.updateOne?.filter?._id;
			expect(docId).toMatch(/^[a-f0-9]{32}$/);
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
					txSender: "0xsender1",
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
					txSender: "0xsender2",
				},
			];

			await service.saveBridges(bridgeTransactions);

			expect(mockBulkWrite).toHaveBeenCalled();
			const call = mockBulkWrite.mock.calls[0]?.[0];
			expect(call).toHaveLength(2);

			const docId1 = call[0]?.updateOne?.filter?._id;
			const docId2 = call[1]?.updateOne?.filter?._id;
			expect(docId1).not.toBe(docId2);
		});
	});

	describe("saveClaims", () => {
		test("should save empty array without error", async () => {
			await service.saveClaims([]);

			expect(mockBulkWrite).toHaveBeenCalledWith([]);
		});

		test("should save single claim transaction", async () => {
			const claimTransaction: IHubClaimTransaction = {
				claimTransactionHash: "0xclaimhash",
				claimBlockNumber: 200,
				claimTimestamp: 1700002000,
				globalIndex: "123456789",
				sourceNetwork: 1,
				depositCount: 42,
				status: TransactionStatus.CLAIMED,
				lastUpdatedAt: Date.now(),
			};

			await service.saveClaims([claimTransaction]);

			expect(mockBulkWrite).toHaveBeenCalled();
			const call = mockBulkWrite.mock.calls[0]?.[0];
			expect(call).toHaveLength(1);
			expect(call[0]).toHaveProperty("updateOne");

			const docId = call[0]?.updateOne?.filter?._id;
			expect(docId).toMatch(/^[a-f0-9]{32}$/);
		});

		test("should save multiple claim transactions", async () => {
			const claimTransactions: IHubClaimTransaction[] = [
				{
					claimTransactionHash: "0xclaimhash1",
					claimBlockNumber: 200,
					claimTimestamp: 1700002000,
					globalIndex: "123456789",
					sourceNetwork: 1,
					depositCount: 42,
					status: TransactionStatus.CLAIMED,
					lastUpdatedAt: Date.now(),
				},
				{
					claimTransactionHash: "0xclaimhash2",
					claimBlockNumber: 201,
					claimTimestamp: 1700003000,
					globalIndex: "987654321",
					sourceNetwork: 2,
					depositCount: 43,
					status: TransactionStatus.CLAIMED,
					lastUpdatedAt: Date.now(),
				},
			];

			await service.saveClaims(claimTransactions);

			expect(mockBulkWrite).toHaveBeenCalled();
			const call = mockBulkWrite.mock.calls[0]?.[0];
			expect(call).toHaveLength(2);

			const docId1 = call[0]?.updateOne?.filter?._id;
			const docId2 = call[1]?.updateOne?.filter?._id;
			expect(docId1).not.toBe(docId2);
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

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]._id).toMatch(/^[a-f0-9]{32}$/);
			expect(call[0].status).toBe(TransactionStatus.BRIDGED);
			expect(call[1].$set.leafIndex).toBe(leafIndex);
			expect(call[1].$set.status).toBe(TransactionStatus.LEAF_INCLUDED);
			expect(call[1].$set.lastUpdatedAt).toBeTypeOf("number");
		});

		test("should generate timestamp within reasonable range", async () => {
			const beforeExecution = Date.now();
			await service.updateLeafIndex(42, 1, 100);
			const afterExecution = Date.now();

			const call = mockUpdateOne.mock.calls[0];
			const timestamp = call[1].$set.lastUpdatedAt;

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
				sourceNetwork,
				50
			);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]._id).toMatch(/^[a-f0-9]{32}$/);
			expect(call[0].status).toBe(TransactionStatus.LEAF_INCLUDED);
			expect(call[1].$set.leafIndexForProof).toBe(50);
			expect(call[1].$set.status).toBe(TransactionStatus.READY_TO_CLAIM);
			expect(call[1].$set.lastUpdatedAt).toBeTypeOf("number");
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

			mockFind.mockReturnValueOnce({
				sort: () => ({
					limit: () => ({
						toArray: () => Promise.resolve(mockTransactions),
					}),
				}),
			} as any);

			const result = await service.getBridgedTransactions(sourceNetwork);

			expect(mockFind).toHaveBeenCalled();
			expect(result).toEqual(mockTransactions);
		});

		test("should get bridged transactions with cursor", async () => {
			const sourceNetwork = 1;
			const afterId = "cursor-123";
			const mockTransactions: IHubBridgedStatusTransactions[] = [];

			mockFind.mockReturnValueOnce({
				sort: () => ({
					limit: () => ({
						toArray: () => Promise.resolve(mockTransactions),
					}),
				}),
			} as any);

			const result = await service.getBridgedTransactions(
				sourceNetwork,
				afterId
			);

			expect(mockFind).toHaveBeenCalled();
			expect(result).toEqual(mockTransactions);
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

			mockFind.mockReturnValueOnce({
				sort: () => ({
					limit: () => ({
						toArray: () => Promise.resolve(mockTransactions),
					}),
				}),
			} as any);

			const result =
				await service.getLeafIncludedTransactions(destinationNetwork);

			expect(mockFind).toHaveBeenCalled();
			expect(result).toEqual(mockTransactions);
		});

		test("should get leaf included transactions with cursor", async () => {
			const destinationNetwork = 137;
			const afterId = "cursor-456";

			mockFind.mockReturnValueOnce({
				sort: () => ({
					limit: () => ({
						toArray: () => Promise.resolve([]),
					}),
				}),
			} as any);

			await service.getLeafIncludedTransactions(
				destinationNetwork,
				afterId
			);

			expect(mockFind).toHaveBeenCalled();
		});
	});

	describe("edge cases", () => {
		test("should handle zero deposit count", async () => {
			await service.updateLeafIndex(0, 1, 50);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]._id).toMatch(/^[a-f0-9]{32}$/);
		});

		test("should handle large network IDs", async () => {
			const largeNetworkId = 999999999;
			await service.updateTransactionToReadyToClaim(
				42,
				largeNetworkId,
				100
			);

			expect(mockUpdateOne).toHaveBeenCalledTimes(1);
		});

		test("should handle negative leaf index", async () => {
			await service.updateLeafIndex(42, 1, -1);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[1].$set.leafIndex).toBe(-1);
		});
	});
});
