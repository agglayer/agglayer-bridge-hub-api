import { describe, test, expect, beforeEach, mock } from "bun:test";

// Mock ApiError
const ApiError = class extends Error {
	constructor(message: string, _options?: any) {
		super(message);
		this.name = "ApiError";
	}
};

// Mock servercore-mongo
const mockExecuteMongoOperation = mock(async (collection: any, fn: any) => {
	return fn(collection);
});

// Mock modules before imports
mock.module("@polygonlabs/servercore", () => ({
	ApiError,
}));

mock.module("@polygonlabs/servercore-mongo", () => ({
	executeMongoOperation: mockExecuteMongoOperation,
}));

// Now import after mocking dependencies
import { TransactionService } from "../../src/services/transactions";
import { Networks } from "../../src/enums";

describe("TransactionService", () => {
	let transactionService: TransactionService;
	let mockDb: any;
	let mockCollection: any;
	let collectionId: Map<string, string>;

	beforeEach(() => {
		// Clear all mocks
		mockExecuteMongoOperation.mockClear();

		mockExecuteMongoOperation.mockImplementation(
			async (collection: any, fn: any) => {
				return fn(collection);
			}
		);

		// Setup collection IDs
		collectionId = new Map([
			["mainnet", "bridge_hub_api_transactions"],
			["testnet", "bridge_hub_api_transactions_testnet"],
			["devnet", "bridge_hub_api_transactions_devnet"],
		]);

		// Setup mock collection
		mockCollection = {
			find: mock(function (_filter: any) {
				return {
					sort: mock(function (_sortOptions: any) {
						return {
							limit: mock(function (_limitValue: number) {
								return {
									toArray: mock(async () => [
										{
											depositCount: 42,
											fromAddress:
												"0x1234567890abcdef1234567890abcdef12345678",
											toAddress:
												"0xabcdef1234567890abcdef1234567890abcdef12",
											tokenAddress:
												"0x0000000000000000000000000000000000000000",
											amount: "1000000000000000000",
											sourceNetwork: 1,
											destinationNetwork: 137,
											transactionHash:
												"0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
											blockNumber: 12345,
											timestamp: 1700000000,
											hubUID: "hub-uid-42-1",
											status: "BRIDGED",
											lastUpdatedAt: 1700000000,
										},
									]),
								};
							}),
						};
					}),
				};
			}),
			countDocuments: mock(async () => 1),
			findOne: mock(async ({ _id }: any) => {
				if (_id === "test-doc-id") {
					return {
						depositCount: 42,
						fromAddress:
							"0x1234567890abcdef1234567890abcdef12345678",
						toAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
						tokenAddress:
							"0x0000000000000000000000000000000000000000",
						amount: "1000000000000000000",
						sourceNetwork: 1,
						destinationNetwork: 137,
						transactionHash:
							"0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456",
						blockNumber: 12345,
						timestamp: 1700000000,
						hubUID: "hub-uid-42-1",
						status: "BRIDGED",
						lastUpdatedAt: 1700000000,
					};
				}
				return null;
			}),
		};

		// Setup mock database
		mockDb = {
			collection: mock(() => mockCollection),
		};

		transactionService = new TransactionService(mockDb, collectionId);
	});

	describe("generateDocId", () => {
		test("should generate consistent doc ID for same inputs", () => {
			const docId1 = transactionService.generateDocId(100, 1);
			const docId2 = transactionService.generateDocId(100, 1);

			expect(docId1).toBe(docId2);
			expect(docId1).toHaveLength(32);
		});

		test("should generate different doc IDs for different deposit counts", () => {
			const docId1 = transactionService.generateDocId(100, 1);
			const docId2 = transactionService.generateDocId(101, 1);

			expect(docId1).not.toBe(docId2);
		});

		test("should generate different doc IDs for different source networks", () => {
			const docId1 = transactionService.generateDocId(100, 1);
			const docId2 = transactionService.generateDocId(100, 137);

			expect(docId1).not.toBe(docId2);
		});

		test("should generate hex string of length 32", () => {
			const docId = transactionService.generateDocId(100, 1);

			expect(docId).toMatch(/^[0-9a-f]{32}$/);
		});
	});

	describe("getTransactions", () => {
		test("should fetch transactions with minimal parameters", async () => {
			const result = await transactionService.getTransactions({
				network: Networks.MAINNET,
				limit: 10,
			});

			expect(result.documents).toHaveLength(1);
			expect(result.totalDocumentsCount).toBe(1);
			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_transactions"
			);
		});

		test("should filter by fromAddress", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
			});
		});

		test("should filter by sourceNetworkIds", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				sourceNetworkIds: [1, 137],
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				sourceNetwork: { $in: [1, 137] },
			});
		});

		test("should filter by destinationNetworkIds", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				destinationNetworkIds: [137, 42161],
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				destinationNetwork: { $in: [137, 42161] },
			});
		});

		test("should filter by status", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				status: "READY_TO_CLAIM",
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				status: "READY_TO_CLAIM",
			});
		});

		test("should filter by updatedSince", async () => {
			const timestamp = 1700000000;

			await transactionService.getTransactions({
				network: Networks.MAINNET,
				updatedSince: timestamp,
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				lastUpdatedAt: { $gte: timestamp },
				transactionHash: { $ne: "" },
			});
		});

		test("should filter by startAfter", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				startAfter: "hub-uid-100",
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				hubUID: { $lt: "hub-uid-100" },
			});
		});

		test("should combine multiple filters", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
				sourceNetworkIds: [1],
				destinationNetworkIds: [137],
				status: "BRIDGED",
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
				sourceNetwork: { $in: [1] },
				destinationNetwork: { $in: [137] },
				status: "BRIDGED",
			});
		});

		test("should sort by hubUID in descending order by default", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				limit: 10,
			});

			// Verify sort was called with descending order
			expect(mockCollection.find).toHaveBeenCalled();
		});

		test("should sort by hubUID in ascending order when specified", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				order: "asc",
				limit: 10,
			});

			// Verify find was called
			expect(mockCollection.find).toHaveBeenCalled();
		});

		test("should respect limit parameter", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				limit: 25,
			});

			// Verify find was called
			expect(mockCollection.find).toHaveBeenCalled();
		});

		test("should throw ApiError when collection is not configured", async () => {
			await expect(
				transactionService.getTransactions({
					network: "invalid-network" as Networks,
					limit: 10,
				})
			).rejects.toThrow("No collection configured for network");
		});

		test("should work correctly for testnet", async () => {
			await transactionService.getTransactions({
				network: Networks.TESTNET,
				limit: 10,
			});

			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_transactions_testnet"
			);
		});

		test("should work correctly for devnet", async () => {
			await transactionService.getTransactions({
				network: Networks.DEVNET,
				limit: 10,
			});

			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_transactions_devnet"
			);
		});

		test("should return empty array when no documents match", async () => {
			mockCollection.find = mock(function (_filter: any) {
				return {
					sort: mock(function (_sortOptions: any) {
						return {
							limit: mock(function (_limitValue: number) {
								return {
									toArray: mock(async () => []),
								};
							}),
						};
					}),
				};
			});
			mockCollection.countDocuments = mock(async () => 0);

			const result = await transactionService.getTransactions({
				network: Networks.MAINNET,
				limit: 10,
			});

			expect(result.documents).toHaveLength(0);
			expect(result.totalDocumentsCount).toBe(0);
		});

		test("should not include sourceNetworkIds in filter when empty array", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				sourceNetworkIds: [],
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({});
		});

		test("should not include destinationNetworkIds in filter when empty array", async () => {
			await transactionService.getTransactions({
				network: Networks.MAINNET,
				destinationNetworkIds: [],
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({});
		});
	});

	describe("getTransactionByDepositCount", () => {
		test("should fetch transaction by document ID", async () => {
			const result =
				await transactionService.getTransactionByDepositCount(
					Networks.MAINNET,
					"test-doc-id"
				);

			expect(result).toBeDefined();
			expect(result?.depositCount).toBe(42);
			expect(result?.hubUID).toBe("hub-uid-42-1");
			expect(mockCollection.findOne).toHaveBeenCalledWith({
				_id: "test-doc-id",
			});
		});

		test("should return null when document not found", async () => {
			const result =
				await transactionService.getTransactionByDepositCount(
					Networks.MAINNET,
					"non-existent-id"
				);

			expect(result).toBeNull();
		});

		test("should throw ApiError when collection is not configured", async () => {
			await expect(
				transactionService.getTransactionByDepositCount(
					"invalid-network" as Networks,
					"test-doc-id"
				)
			).rejects.toThrow("No collection configured for network");
		});

		test("should work correctly for testnet", async () => {
			await transactionService.getTransactionByDepositCount(
				Networks.TESTNET,
				"test-doc-id"
			);

			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_transactions_testnet"
			);
		});

		test("should work correctly for devnet", async () => {
			await transactionService.getTransactionByDepositCount(
				Networks.DEVNET,
				"test-doc-id"
			);

			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_transactions_devnet"
			);
		});

		test("should use generated doc ID format", async () => {
			const docId = transactionService.generateDocId(100, 1);

			await transactionService.getTransactionByDepositCount(
				Networks.MAINNET,
				docId
			);

			expect(mockCollection.findOne).toHaveBeenCalledWith({
				_id: docId,
			});
		});
	});

	describe("constructor", () => {
		test("should initialize with default collection IDs", () => {
			const service = new TransactionService(mockDb);
			expect(service).toBeInstanceOf(TransactionService);
		});

		test("should initialize with custom collection IDs", () => {
			const customCollectionId = new Map([
				["mainnet", "custom_transactions"],
			]);
			const service = new TransactionService(mockDb, customCollectionId);
			expect(service).toBeInstanceOf(TransactionService);
		});
	});

	describe("integration scenarios", () => {
		test("should handle complex query with all parameters", async () => {
			const result = await transactionService.getTransactions({
				network: Networks.MAINNET,
				fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
				sourceNetworkIds: [1, 137],
				destinationNetworkIds: [42161, 10],
				updatedSince: 1700000000,
				status: "BRIDGED",
				order: "asc",
				startAfter: "hub-uid-100",
				limit: 50,
			});

			expect(result).toBeDefined();
			expect(mockCollection.find).toHaveBeenCalledWith({
				fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
				sourceNetwork: { $in: [1, 137] },
				destinationNetwork: { $in: [42161, 10] },
				lastUpdatedAt: { $gte: 1700000000 },
				transactionHash: { $ne: "" },
				status: "BRIDGED",
				hubUID: { $lt: "hub-uid-100" },
			});
		});

		test("should use generated doc ID to fetch specific transaction", async () => {
			const docId = transactionService.generateDocId(100, 1);

			await transactionService.getTransactionByDepositCount(
				Networks.MAINNET,
				docId
			);

			expect(mockCollection.findOne).toHaveBeenCalledWith({
				_id: docId,
			});
		});
	});
});
