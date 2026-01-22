import { describe, test, expect, beforeEach, mock, beforeAll } from "bun:test";
import { Logger } from "@polygonlabs/servercore";
import TokenMappingsService from "../../src/services/mapping";
import type { IHubTokenMappings } from "../../src/interfaces/token_mapping";

// Initialize Logger for tests
beforeAll(() => {
	Logger.create({});
});

const mockBulkWrite = mock((_operations: any) => Promise.resolve({}));

const mockCollection = {
	bulkWrite: mockBulkWrite,
	collectionName: "test_tokenMappings",
	dbName: "test_db",
} as any;

describe("TokenMappingsService", () => {
	let service: TokenMappingsService;
	const mockCollectionId = "test_tokenMappings";

	beforeEach(() => {
		service = new TokenMappingsService(mockCollection, mockCollectionId);
		mockBulkWrite.mockClear();
	});

	describe("constructor", () => {
		test("should initialize with default collection ID", () => {
			const defaultService = new TokenMappingsService(mockCollection);
			expect(defaultService).toBeInstanceOf(TokenMappingsService);
		});

		test("should initialize with custom collection ID", () => {
			const customService = new TokenMappingsService(
				mockCollection,
				"custom_collection"
			);
			expect(customService).toBeInstanceOf(TokenMappingsService);
		});
	});

	describe("generateDocId", () => {
		test("should generate consistent document ID for same inputs", async () => {
			const mapping1: IHubTokenMappings = {
				originTokenAddress:
					"0x1234567890123456789012345678901234567890",
				originTokenNetwork: 1,
				wrappedTokenNetwork: 137,
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash1",
				wrappedTokenAddress: "0xwrapped1",
				lastUpdatedAt: Date.now(),
			};

			const mapping2: IHubTokenMappings = {
				originTokenAddress:
					"0x1234567890123456789012345678901234567890",
				originTokenNetwork: 1,
				wrappedTokenNetwork: 137,
				blockNumber: 200, // Different block number
				transactionIndex: 2, // Different transaction index
				timestamp: 1700001000, // Different timestamp
				transactionHash: "0xhash2", // Different hash
				wrappedTokenAddress: "0xwrapped2", // Different wrapped address
				lastUpdatedAt: Date.now(), // Different lastUpdatedAt
			};

			// Call saveTokenMappings to test the private generateDocId method indirectly
			await service.saveTokenMappings([mapping1]);
			await service.saveTokenMappings([mapping2]);

			// Both calls should use bulkWrite
			expect(mockBulkWrite).toHaveBeenCalledTimes(2);

			const firstCall = mockBulkWrite.mock.calls[0]?.[0];
			const secondCall = mockBulkWrite.mock.calls[1]?.[0];

			// Extract _id from replaceOne operations
			const firstId = firstCall[0]?.replaceOne?.filter?._id;
			const secondId = secondCall[0]?.replaceOne?.filter?._id;

			// The docIds should be the same for both calls since they use the same key fields
			expect(firstId).toBe(secondId);
		});

		test("should generate different document IDs for different key inputs", async () => {
			const mapping1: IHubTokenMappings = {
				originTokenAddress:
					"0x1234567890123456789012345678901234567890",
				originTokenNetwork: 1,
				wrappedTokenNetwork: 137,
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash1",
				wrappedTokenAddress: "0xwrapped1",
				lastUpdatedAt: Date.now(),
			};

			const mapping2: IHubTokenMappings = {
				...mapping1,
				originTokenAddress:
					"0x9876543210987654321098765432109876543210", // Different origin address
			};

			await service.saveTokenMappings([mapping1]);
			await service.saveTokenMappings([mapping2]);

			const firstCall = mockBulkWrite.mock.calls[0]?.[0];
			const secondCall = mockBulkWrite.mock.calls[1]?.[0];

			// Extract _id from replaceOne operations
			const firstId = firstCall[0]?.replaceOne?.filter?._id;
			const secondId = secondCall[0]?.replaceOne?.filter?._id;

			// The docIds should be different for different key fields
			expect(firstId).not.toBe(secondId);
		});
	});

	describe("saveTokenMappings", () => {
		test("should save empty array without error", async () => {
			await service.saveTokenMappings([]);

			expect(mockBulkWrite).toHaveBeenCalledWith([]);
		});

		test("should save single token mapping", async () => {
			const mapping: IHubTokenMappings = {
				originTokenAddress:
					"0x1234567890123456789012345678901234567890",
				originTokenNetwork: 1,
				wrappedTokenNetwork: 137,
				wrappedTokenAddress:
					"0x9876543210987654321098765432109876543210",
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash",
				lastUpdatedAt: Date.now(),
			};

			await service.saveTokenMappings([mapping]);

			expect(mockBulkWrite).toHaveBeenCalled();

			const call = mockBulkWrite.mock.calls[0]?.[0];
			expect(call).toHaveLength(1);
			expect(call[0]).toHaveProperty("replaceOne");

			const docId = call[0]?.replaceOne?.filter?._id;
			expect(docId).toMatch(/^[a-f0-9]{32}$/); // 32-char hex string
			expect(docId).toHaveLength(32);
		});

		test("should save multiple token mappings", async () => {
			const mappings: IHubTokenMappings[] = [
				{
					originTokenAddress:
						"0x1111111111111111111111111111111111111111",
					originTokenNetwork: 1,
					wrappedTokenNetwork: 137,
					wrappedTokenAddress:
						"0x2222222222222222222222222222222222222222",
					blockNumber: 100,
					transactionIndex: 1,
					timestamp: 1700000000,
					transactionHash: "0xhash1",
					lastUpdatedAt: Date.now(),
				},
				{
					originTokenAddress:
						"0x3333333333333333333333333333333333333333",
					originTokenNetwork: 2,
					wrappedTokenNetwork: 137,
					wrappedTokenAddress:
						"0x4444444444444444444444444444444444444444",
					blockNumber: 101,
					transactionIndex: 2,
					timestamp: 1700001000,
					transactionHash: "0xhash2",
					lastUpdatedAt: Date.now(),
				},
			];

			await service.saveTokenMappings(mappings);

			expect(mockBulkWrite).toHaveBeenCalled();

			const call = mockBulkWrite.mock.calls[0]?.[0];
			expect(call).toHaveLength(2);

			const docId1 = call[0]?.replaceOne?.filter?._id;
			const docId2 = call[1]?.replaceOne?.filter?._id;

			expect(docId1).toMatch(/^[a-f0-9]{32}$/);
			expect(docId2).toMatch(/^[a-f0-9]{32}$/);
			expect(docId1).not.toBe(docId2); // Should be different IDs
		});

		test("should generate 32-character hex document IDs", async () => {
			const mapping: IHubTokenMappings = {
				originTokenAddress:
					"0x1234567890123456789012345678901234567890",
				originTokenNetwork: 1,
				wrappedTokenNetwork: 137,
				wrappedTokenAddress:
					"0x9876543210987654321098765432109876543210",
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash",
				lastUpdatedAt: Date.now(),
			};

			await service.saveTokenMappings([mapping]);

			const call = mockBulkWrite.mock.calls[0]?.[0];
			const docId = call[0]?.replaceOne?.filter?._id;

			expect(docId).toMatch(/^[a-f0-9]{32}$/);
			expect(docId).toHaveLength(32);
		});

		test("should handle database call without throwing", async () => {
			const mapping: IHubTokenMappings = {
				originTokenAddress:
					"0x1234567890123456789012345678901234567890",
				originTokenNetwork: 1,
				wrappedTokenNetwork: 137,
				wrappedTokenAddress:
					"0x9876543210987654321098765432109876543210",
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash",
				lastUpdatedAt: Date.now(),
			};

			// Test that it doesn't throw
			expect(
				service.saveTokenMappings([mapping])
			).resolves.toBeUndefined();
		});
	});

	describe("edge cases", () => {
		test("should handle mappings with same origin but different wrapped networks", async () => {
			const mapping1: IHubTokenMappings = {
				originTokenAddress:
					"0x1234567890123456789012345678901234567890",
				originTokenNetwork: 1,
				wrappedTokenNetwork: 137,
				wrappedTokenAddress:
					"0x9876543210987654321098765432109876543210",
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash1",
				lastUpdatedAt: Date.now(),
			};

			const mapping2: IHubTokenMappings = {
				...mapping1,
				wrappedTokenNetwork: 42, // Different wrapped network
				transactionHash: "0xhash2",
			};

			await service.saveTokenMappings([mapping1, mapping2]);

			const call = mockBulkWrite.mock.calls[0]?.[0];
			expect(call).toHaveLength(2);

			const docId1 = call[0]?.replaceOne?.filter?._id;
			const docId2 = call[1]?.replaceOne?.filter?._id;
			expect(docId1).not.toBe(docId2); // Should generate different IDs
		});

		test("should handle very long addresses", async () => {
			const mapping: IHubTokenMappings = {
				originTokenAddress: "0x" + "a".repeat(40),
				originTokenNetwork: 1,
				wrappedTokenNetwork: 137,
				wrappedTokenAddress: "0x" + "b".repeat(40),
				blockNumber: 100,
				transactionIndex: 1,
				timestamp: 1700000000,
				transactionHash: "0xhash",
				lastUpdatedAt: Date.now(),
			};

			expect(
				service.saveTokenMappings([mapping])
			).resolves.toBeUndefined();

			const call = mockBulkWrite.mock.calls[0]?.[0];
			const docId = call[0]?.replaceOne?.filter?._id;
			expect(docId).toMatch(/^[a-f0-9]{32}$/);
		});
	});
});
