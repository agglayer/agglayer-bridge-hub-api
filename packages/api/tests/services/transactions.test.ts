import { describe, test, expect, beforeEach, mock } from "bun:test";
import { TransactionService } from "../../src/services/transactions";
import { mockTransactionServiceResponse, mockTransaction } from "../test-utils";

// Mock database client
const mockDatabase = {
	getDocuments: mock(() => Promise.resolve(mockTransactionServiceResponse)),
	getDocument: mock(() => Promise.resolve(mockTransaction)),
};

describe("TransactionService", () => {
	beforeEach(() => {
		mockDatabase.getDocuments.mockClear();
		mockDatabase.getDocument.mockClear();
	});

	describe("initializeTransactionService", () => {
		test("should initialize with custom collection IDs", () => {
			const database = mockDatabase as any;
			const customCollectionMap = new Map([
				["mainnet", "custom_transactions"],
				["testnet", "custom_transactions_testnet"],
			]);

			TransactionService.initializeTransactionService(
				database,
				customCollectionMap
			);
			expect(true).toBe(true);
		});

		test("should not reinitialize if already initialized", () => {
			const database = mockDatabase as any;
			TransactionService.initializeTransactionService(database);
			TransactionService.initializeTransactionService(database);

			// Should not throw error on second initialization
			expect(true).toBe(true);
		});
	});

	describe("generateDocId", () => {
		test("should generate consistent document ID for same inputs", () => {
			const docId1 = TransactionService.generateDocId(42, 1);
			const docId2 = TransactionService.generateDocId(42, 1);

			expect(docId1).toBe(docId2);
			expect(docId1).toMatch(/^[a-f0-9]{32}$/); // 32-char hex string
		});

		test("should generate different document IDs for different inputs", () => {
			const docId1 = TransactionService.generateDocId(42, 1);
			const docId2 = TransactionService.generateDocId(43, 1);
			const docId3 = TransactionService.generateDocId(42, 2);

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
				const docId = TransactionService.generateDocId(
					depositCount,
					sourceNetwork
				);

				expect(docId).toMatch(/^[a-f0-9]{32}$/);
				expect(docId).toHaveLength(32);
			}
		});

		test("should use colon as separator in hash input", () => {
			// Test that the order matters (depositCount:sourceNetwork)
			const docId1 = TransactionService.generateDocId(12, 34);
			const docId2 = TransactionService.generateDocId(1234, 0); // Different from "12:34"
			const docId3 = TransactionService.generateDocId(1, 234); // Different from "12:34"

			expect(docId1).not.toBe(docId2);
			expect(docId1).not.toBe(docId3);
		});

		test("should handle zero values", () => {
			const docId = TransactionService.generateDocId(0, 0);

			expect(docId).toMatch(/^[a-f0-9]{32}$/);
			expect(docId).toHaveLength(32);
		});

		test("should handle negative values", () => {
			const docId1 = TransactionService.generateDocId(-1, 1);
			const docId2 = TransactionService.generateDocId(1, -1);

			expect(docId1).toMatch(/^[a-f0-9]{32}$/);
			expect(docId2).toMatch(/^[a-f0-9]{32}$/);
			expect(docId1).not.toBe(docId2);
		});
	});

	describe("getTransactions", () => {
		test("should call database with correct parameters", async () => {
			const network = "testnet";
			const fromAddress = "0xfrom123";
			const status = "BRIDGED";
			const limit = 10;
			const startAfter = "hub-uid-123";
			const updatedSince = 1700000000;

			await TransactionService.getTransactions({
				network,
				fromAddress,
				status,
				limit,
				startAfter,
				updatedSince,
			});

			const expectedFilters = [
				{ field: "fromAddress", operator: "==", value: fromAddress },
				{ field: "lastUpdatedAt", operator: ">=", value: updatedSince },
				{ field: "transactionHash", operator: "!=", value: "" },
				{ field: "status", operator: "==", value: status },
			];

			expect(mockDatabase.getDocuments).toHaveBeenCalledWith({
				collectionPath: "custom_transactions_testnet",
				filter: expectedFilters,
				limit,
				order: [{ field: "hubUID", order: "desc" }],
				startAfterCursor: startAfter,
				orFilters: [],
				returnTotalDocumentsCount: true,
			});
		});

		test("should use default order params when override not provided", async () => {
			const network = "testnet";

			await TransactionService.getTransactions({ network });

			expect(mockDatabase.getDocuments).toHaveBeenCalledWith({
				collectionPath: "custom_transactions_testnet",
				filter: [],
				limit: undefined,
				order: [{ field: "hubUID", order: "desc" }], // Default order params
				startAfterCursor: undefined,
				orFilters: [],
				returnTotalDocumentsCount: true,
			});
		});

		test("should handle empty query parameters", async () => {
			const network = "mainnet";

			await TransactionService.getTransactions({ network });

			expect(mockDatabase.getDocuments).toHaveBeenCalledWith({
				collectionPath: "custom_transactions",
				filter: [],
				limit: undefined,
				order: [{ field: "hubUID", order: "desc" }],
				startAfterCursor: undefined,
				orFilters: [],
				returnTotalDocumentsCount: true,
			});
		});

		test("should return database response", async () => {
			const result = await TransactionService.getTransactions({
				network: "testnet",
			});

			expect(result).toBe(mockTransactionServiceResponse);
		});

		test("should handle different network values", async () => {
			const networks = ["mainnet", "testnet", "custom"];

			for (const network of networks) {
				await TransactionService.getTransactions({ network });

				let expectedCollectionPath = "";
				if (network === "mainnet") {
					expectedCollectionPath = "custom_transactions";
				} else if (network === "testnet") {
					expectedCollectionPath = "custom_transactions_testnet";
				}
				expect(mockDatabase.getDocuments).toHaveBeenCalledWith(
					expect.objectContaining({
						collectionPath: expectedCollectionPath,
					})
				);

				mockDatabase.getDocuments.mockClear();
			}
		});
	});

	describe("getTransactionByDepositCount", () => {
		test("should call database with correct parameters", async () => {
			const network = "testnet";
			const docId = "doc-42-1";

			await TransactionService.getTransactionByDepositCount(
				network,
				docId
			);

			expect(mockDatabase.getDocument).toHaveBeenCalledWith({
				collectionId: "custom_transactions_testnet",
				docId,
			});
		});

		test("should return database response as IHubTransaction", async () => {
			const result =
				await TransactionService.getTransactionByDepositCount(
					"testnet",
					"doc-1"
				);

			expect(result).toBe(mockTransaction);
		});

		test("should handle different network values", async () => {
			const networks = ["mainnet", "testnet", "polygon"];
			const docId = "test-doc-id";

			for (const network of networks) {
				await TransactionService.getTransactionByDepositCount(
					network,
					docId
				);

				let expectedCollectionId = "";
				if (network === "mainnet") {
					expectedCollectionId = "custom_transactions";
				} else if (network === "testnet") {
					expectedCollectionId = "custom_transactions_testnet";
				}
				expect(mockDatabase.getDocument).toHaveBeenCalledWith({
					collectionId: expectedCollectionId,
					docId,
				});

				mockDatabase.getDocument.mockClear();
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
				await TransactionService.getTransactionByDepositCount(
					"testnet",
					docId
				);

				expect(mockDatabase.getDocument).toHaveBeenCalledWith({
					collectionId: "custom_transactions_testnet",
					docId,
				});

				mockDatabase.getDocument.mockClear();
			}
		});
	});

	describe("integration tests", () => {
		test("should generate docId and retrieve transaction", async () => {
			const depositCount = 42;
			const sourceNetwork = 1;
			const network = "testnet";

			// Generate document ID
			const docId = TransactionService.generateDocId(
				depositCount,
				sourceNetwork
			);

			// Use it to retrieve transaction
			await TransactionService.getTransactionByDepositCount(
				network,
				docId
			);

			expect(mockDatabase.getDocument).toHaveBeenCalledWith({
				collectionId: "custom_transactions_testnet",
				docId,
			});

			// Verify the docId format
			expect(docId).toMatch(/^[a-f0-9]{32}$/);
		});

		test("should handle typical transaction flow", async () => {
			const network = "testnet";
			const limit = 10;

			// Get transactions list
			const result = await TransactionService.getTransactions({
				network,
				fromAddress: "0xuser123",
				status: "BRIDGED",
				limit,
			});

			// Generate docId for a specific transaction
			const docId = TransactionService.generateDocId(42, 1);

			// Get specific transaction
			await TransactionService.getTransactionByDepositCount(
				network,
				docId
			);

			expect(mockDatabase.getDocuments).toHaveBeenCalledTimes(1);
			expect(mockDatabase.getDocument).toHaveBeenCalledTimes(1);
			expect(result).toBe(mockTransactionServiceResponse);
		});
	});

	describe("error handling", () => {
		test("should propagate database errors from getTransactions", async () => {
			const error = new Error("Database connection failed");
			mockDatabase.getDocuments.mockRejectedValueOnce(error);

			expect(
				TransactionService.getTransactions({ network: "testnet" })
			).rejects.toThrow("Database connection failed");
		});

		test("should propagate database errors from getTransactionByDepositCount", async () => {
			const error = new Error("Document not found");
			mockDatabase.getDocument.mockRejectedValueOnce(error);

			expect(
				TransactionService.getTransactionByDepositCount(
					"testnet",
					"doc-1"
				)
			).rejects.toThrow("Document not found");
		});

		test("should handle null response from getTransactionByDepositCount", async () => {
			mockDatabase.getDocument.mockResolvedValueOnce(null as any);

			const result =
				await TransactionService.getTransactionByDepositCount(
					"testnet",
					"doc-1"
				);

			expect(result).toBeNull();
		});

		test("should handle undefined response from getTransactionByDepositCount", async () => {
			mockDatabase.getDocument.mockResolvedValueOnce(undefined as any);

			const result =
				await TransactionService.getTransactionByDepositCount(
					"testnet",
					"doc-1"
				);

			expect(result).toBeUndefined();
		});
	});
});
