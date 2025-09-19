import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import TokenMappingsService from "../../src/services/mapping";
import type { IHubTokenMappings } from "../../src/interfaces/token_mapping";

const mockAddDocuments = mock((_params: any) => {});

const mockDatabase = {
	addDocuments: mockAddDocuments,
} as unknown as DatabaseClient;

describe("TokenMappingsService", () => {
	let service: TokenMappingsService;
	const mockCollectionId = "test_tokenMappings";

	beforeEach(() => {
		service = new TokenMappingsService(mockDatabase, mockCollectionId);
		mockAddDocuments.mockClear();
	});

	describe("constructor", () => {
		test("should initialize with default collection ID", () => {
			const defaultService = new TokenMappingsService(mockDatabase);
			expect(defaultService).toBeInstanceOf(TokenMappingsService);
		});

		test("should initialize with custom collection ID", () => {
			const customService = new TokenMappingsService(
				mockDatabase,
				"custom_collection"
			);
			expect(customService).toBeInstanceOf(TokenMappingsService);
		});
	});

	describe("generateDocId", () => {
		test("should generate consistent document ID for same inputs", () => {
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
			service.saveTokenMappings([mapping1]);
			service.saveTokenMappings([mapping2]);

			// Both calls should use the same docId since they have the same key fields
			expect(mockAddDocuments).toHaveBeenCalledTimes(2);

			const firstCall = mockAddDocuments.mock.calls[0]?.[0];
			const secondCall = mockAddDocuments.mock.calls[1]?.[0];

			// The docIds should be the same for both calls since they use the same key fields
			expect(firstCall?.docIds[0]).toBe(secondCall?.docIds[0]);
		});

		test("should generate different document IDs for different key inputs", () => {
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

			service.saveTokenMappings([mapping1]);
			service.saveTokenMappings([mapping2]);

			const firstCall = mockAddDocuments.mock.calls[0]?.[0];
			const secondCall = mockAddDocuments.mock.calls[1]?.[0];

			// The docIds should be different for different key fields
			expect(firstCall?.docIds[0]).not.toBe(secondCall?.docIds[0]);
		});
	});

	describe("saveTokenMappings", () => {
		test("should save empty array without error", async () => {
			await service.saveTokenMappings([]);

			expect(mockAddDocuments).toHaveBeenCalledWith({
				collectionPaths: mockCollectionId,
				docDatas: [],
				docIds: [],
			});
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

			expect(mockAddDocuments).toHaveBeenCalledWith({
				collectionPaths: mockCollectionId,
				docDatas: [mapping],
				docIds: expect.arrayContaining([expect.any(String)]),
			});

			const call = mockAddDocuments.mock.calls[0]?.[0];
			expect(call?.docIds).toHaveLength(1);
			expect(call?.docIds[0]).toMatch(/^[a-f0-9]{32}$/); // 32-char hex string
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

			expect(mockAddDocuments).toHaveBeenCalledWith({
				collectionPaths: mockCollectionId,
				docDatas: mappings,
				docIds: expect.arrayContaining([
					expect.any(String),
					expect.any(String),
				]),
			});

			const call = mockAddDocuments.mock.calls[0]?.[0];
			expect(call?.docIds).toHaveLength(2);
			expect(call?.docIds[0]).toMatch(/^[a-f0-9]{32}$/);
			expect(call?.docIds[1]).toMatch(/^[a-f0-9]{32}$/);
			expect(call?.docIds[0]).not.toBe(call?.docIds[1]); // Should be different IDs
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

			const call = mockAddDocuments.mock.calls[0]?.[0];
			const docId = call?.docIds[0];

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

			const call = mockAddDocuments.mock.calls[0]?.[0];
			expect(call?.docIds).toHaveLength(2);
			expect(call?.docIds[0]).not.toBe(call?.docIds[1]); // Should generate different IDs
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

			const call = mockAddDocuments.mock.calls[0]?.[0];
			expect(call?.docIds[0]).toMatch(/^[a-f0-9]{32}$/);
		});
	});
});
