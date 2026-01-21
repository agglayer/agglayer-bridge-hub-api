import { describe, test, expect, beforeEach, mock } from "bun:test";
import { TransactionService } from "../../src/services/transactions";
import { mockTransactionServiceResponse, mockTransaction } from "../test-utils";
import type { Db, Collection } from "mongodb";

// Mock executeMongoOperation to simply execute the callback
mock.module("@agglayer/bridge-hub-commons", () => ({
	executeMongoOperation: async (collection: any, callback: any) => {
		return await callback(collection);
	},
}));

// Mock MongoDB Collection methods
const mockFind = mock(() => ({
	sort: mock(() => ({
		limit: mock(() => ({
			toArray: mock(() =>
				Promise.resolve(mockTransactionServiceResponse.documents)
			),
		})),
	})),
}));

const mockCountDocuments = mock(() =>
	Promise.resolve(mockTransactionServiceResponse.totalDocumentsCount)
);

const mockFindOne = mock(() => Promise.resolve(mockTransaction));

const mockCollection = {
	find: mockFind,
	countDocuments: mockCountDocuments,
	findOne: mockFindOne,
	collectionName: "bridge_hub_api_transactions_testnet",
} as unknown as Collection;

// Mock MongoDB Db
const mockDatabase = {
	collection: mock(() => mockCollection),
} as unknown as Db;

describe("TransactionService", () => {
	let transactionService: TransactionService;

	beforeEach(() => {
		mockFind.mockClear();
		mockCountDocuments.mockClear();
		mockFindOne.mockClear();
		(mockDatabase.collection as any).mockClear();

		// Create a new service instance for each test
		transactionService = new TransactionService(mockDatabase);
	});

	describe("generateDocId", () => {
		test("should generate consistent document ID for same inputs", () => {
			const docId1 = transactionService.generateDocId(42, 1);
			const docId2 = transactionService.generateDocId(42, 1);

			expect(docId1).toBe(docId2);
			expect(docId1).toMatch(/^[a-f0-9]{32}$/); // 32-char hex string
		});

		test("should generate different document IDs for different inputs", () => {
			const docId1 = transactionService.generateDocId(42, 1);
			const docId2 = transactionService.generateDocId(43, 1);
			const docId3 = transactionService.generateDocId(42, 2);

			expect(docId1).not.toBe(docId2);
			expect(docId1).not.toBe(docId3);
			expect(docId2).not.toBe(docId3);
		});

		test("should generate 32-character hex strings", () => {
			const testCases = [
				{ depositCount: 0, sourceNetwork: 0 },
				{ depositCount: 1, sourceNetwork: 1 },
				{ depositCount: 999999, sourceNetwork: 137 },
				{ depositCount: Number.MAX_SAFE_INTEGER, sourceNetwork: 42 },
			];

			for (const { depositCount, sourceNetwork } of testCases) {
				const docId = transactionService.generateDocId(
					depositCount,
					sourceNetwork
				);

				expect(docId).toMatch(/^[a-f0-9]{32}$/);
				expect(docId).toHaveLength(32);
			}
		});

		test("should use colon as separator in hash input", () => {
			// Test that the order matters (depositCount:sourceNetwork)
			const docId1 = transactionService.generateDocId(12, 34);
			const docId2 = transactionService.generateDocId(1234, 0); // Different from "12:34"
			const docId3 = transactionService.generateDocId(1, 234); // Different from "12:34"

			expect(docId1).not.toBe(docId2);
			expect(docId1).not.toBe(docId3);
		});

		test("should handle zero values", () => {
			const docId = transactionService.generateDocId(0, 0);

			expect(docId).toMatch(/^[a-f0-9]{32}$/);
			expect(docId).toHaveLength(32);
		});

		test("should handle negative values", () => {
			const docId1 = transactionService.generateDocId(-1, 1);
			const docId2 = transactionService.generateDocId(1, -1);

			expect(docId1).toMatch(/^[a-f0-9]{32}$/);
			expect(docId2).toMatch(/^[a-f0-9]{32}$/);
			expect(docId1).not.toBe(docId2);
		});
	});

	describe("getTransactions", () => {
		test("should call MongoDB with correct filter parameters", async () => {
			const network = "testnet";
			const fromAddress = "0xfrom123";
			const status = "BRIDGED";
			const limit = 10;
			const startAfter = "hub-uid-123";
			const updatedSince = 1700000000;

			await transactionService.getTransactions({
				network,
				fromAddress,
				status,
				limit,
				startAfter,
				updatedSince,
			});

			// Verify collection was accessed
			expect(mockDatabase.collection).toHaveBeenCalledWith(
				"bridge_hub_api_transactions_testnet"
			);

			// Verify find was called with correct filter
			expect(mockFind).toHaveBeenCalled();
			const filterArg = (mockFind.mock.calls as any)[0][0];

			expect(filterArg).toEqual({
				fromAddress,
				lastUpdatedAt: { $gte: updatedSince },
				transactionHash: { $ne: "" },
				status,
				hubUID: { $lt: startAfter },
			});
		});

		test("should use default order when no override provided", async () => {
			const network = "testnet";

			await transactionService.getTransactions({ network });

			expect(mockFind).toHaveBeenCalledWith({});
		});

		test("should handle empty query parameters", async () => {
			const network = "mainnet";

			await transactionService.getTransactions({ network });

			expect(mockDatabase.collection).toHaveBeenCalledWith(
				"bridge_hub_api_transactions"
			);
			expect(mockFind).toHaveBeenCalledWith({});
		});

		test("should return documents and totalDocumentsCount", async () => {
			const result = await transactionService.getTransactions({
				network: "testnet",
				limit: 10,
			});

			expect(result).toEqual({
				documents: mockTransactionServiceResponse.documents,
				totalDocumentsCount:
					mockTransactionServiceResponse.totalDocumentsCount,
			});
		});

		test("should handle sourceNetworkIds parameter", async () => {
			const sourceNetworkIds = [1, 137, 42];

			await transactionService.getTransactions({
				network: "testnet",
				sourceNetworkIds,
			});

			const filterArg = (mockFind.mock.calls as any)[0][0];
			expect(filterArg.sourceNetwork).toEqual({ $in: sourceNetworkIds });
		});

		test("should handle destinationNetworkIds parameter", async () => {
			const destinationNetworkIds = [1, 137];

			await transactionService.getTransactions({
				network: "testnet",
				destinationNetworkIds,
			});

			const filterArg = (mockFind.mock.calls as any)[0][0];
			expect(filterArg.destinationNetwork).toEqual({
				$in: destinationNetworkIds,
			});
		});
	});

	describe("getTransactionByDepositCount", () => {
		test("should call MongoDB findOne with correct docId", async () => {
			const network = "testnet";
			const docId = transactionService.generateDocId(42, 1);

			await transactionService.getTransactionByDepositCount(
				network,
				docId
			);

			expect(mockDatabase.collection).toHaveBeenCalledWith(
				"bridge_hub_api_transactions_testnet"
			);
			expect(mockFindOne).toHaveBeenCalledWith({ _id: docId });
		});

		test("should return transaction document", async () => {
			const result =
				await transactionService.getTransactionByDepositCount(
					"testnet",
					"doc-1"
				);

			expect(result).toBe(mockTransaction);
		});

		test("should handle different network values", async () => {
			const networks = ["mainnet", "testnet"];
			const docId = "test-doc-id";

			for (const network of networks) {
				await transactionService.getTransactionByDepositCount(
					network,
					docId
				);

				const expectedCollectionId =
					network === "mainnet"
						? "bridge_hub_api_transactions"
						: "bridge_hub_api_transactions_testnet";

				expect(mockDatabase.collection).toHaveBeenCalledWith(
					expectedCollectionId
				);

				(mockDatabase.collection as any).mockClear();
				mockFindOne.mockClear();
			}
		});

		test("should handle various document ID formats", async () => {
			const docIds = [
				"simple-id",
				"doc-with-numbers-123",
				"very-long-document-id-with-many-segments",
				"short",
				"",
			];

			for (const docId of docIds) {
				await transactionService.getTransactionByDepositCount(
					"testnet",
					docId
				);

				expect(mockFindOne).toHaveBeenCalledWith({ _id: docId });

				mockFindOne.mockClear();
			}
		});
	});

	describe("integration tests", () => {
		test("should generate docId and retrieve transaction", async () => {
			const depositCount = 42;
			const sourceNetwork = 1;
			const network = "testnet";

			// Generate document ID
			const docId = transactionService.generateDocId(
				depositCount,
				sourceNetwork
			);

			// Use it to retrieve transaction
			await transactionService.getTransactionByDepositCount(
				network,
				docId
			);

			expect(mockFindOne).toHaveBeenCalledWith({ _id: docId });

			// Verify the docId format
			expect(docId).toMatch(/^[a-f0-9]{32}$/);
		});

		test("should handle typical transaction flow", async () => {
			const network = "testnet";
			const limit = 10;

			// Get transactions list
			const result = await transactionService.getTransactions({
				network,
				fromAddress: "0xuser123",
				status: "BRIDGED",
				limit,
			});

			// Generate docId for a specific transaction
			const docId = transactionService.generateDocId(42, 1);

			// Get specific transaction
			await transactionService.getTransactionByDepositCount(
				network,
				docId
			);

			expect(mockFind).toHaveBeenCalledTimes(1);
			expect(mockFindOne).toHaveBeenCalledTimes(1);
			expect(result.documents).toBe(
				mockTransactionServiceResponse.documents
			);
		});
	});

	describe("error handling", () => {
		test("should propagate database errors from getTransactions", async () => {
			const error = new Error("Database connection failed");
			mockFind.mockReturnValueOnce({
				sort: () => ({
					limit: () => ({
						toArray: () => Promise.reject(error),
					}),
				}),
			});

			expect(
				transactionService.getTransactions({ network: "testnet" })
			).rejects.toThrow("Database connection failed");
		});

		test("should propagate database errors from getTransactionByDepositCount", async () => {
			const error = new Error("Document not found");
			mockFindOne.mockRejectedValueOnce(error);

			expect(
				transactionService.getTransactionByDepositCount(
					"testnet",
					"doc-1"
				)
			).rejects.toThrow("Document not found");
		});

		test("should handle null response from getTransactionByDepositCount", async () => {
			mockFindOne.mockResolvedValueOnce(null as any);

			const result =
				await transactionService.getTransactionByDepositCount(
					"testnet",
					"doc-1"
				);

			expect(result).toBeNull();
		});

		test("should handle undefined response from getTransactionByDepositCount", async () => {
			mockFindOne.mockResolvedValueOnce(undefined as any);

			const result =
				await transactionService.getTransactionByDepositCount(
					"testnet",
					"doc-1"
				);

			expect(result).toBeUndefined();
		});

		test("should throw ApiError when network not configured", async () => {
			expect(
				transactionService.getTransactions({ network: "invalid" })
			).rejects.toThrow("No collection configured for network");
		});
	});
});
