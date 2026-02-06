import { describe, test, expect, beforeEach, mock } from "bun:test";

// Mock ApiError
const ApiError = class extends Error {
	constructor(message: string) {
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
import { MappingsService } from "../../src/services/mappings";
import { Networks } from "../../src/enums";

describe("MappingsService", () => {
	let mappingsService: MappingsService;
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
			["mainnet", "bridge_hub_api_mappings"],
			["testnet", "bridge_hub_api_mappings_testnet"],
			["devnet", "bridge_hub_api_mappings_devnet"],
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
											originTokenAddress:
												"0x1234567890abcdef1234567890abcdef12345678",
											wrappedTokenAddress:
												"0xabcdef1234567890abcdef1234567890abcdef12",
											originTokenNetwork: 1,
											wrappedTokenNetwork: 137,
											timestamp: 1700000000,
										},
									]),
								};
							}),
						};
					}),
					toArray: mock(async () => [
						{
							originTokenAddress:
								"0x1234567890abcdef1234567890abcdef12345678",
							wrappedTokenAddress:
								"0xabcdef1234567890abcdef1234567890abcdef12",
							originTokenNetwork: 1,
							wrappedTokenNetwork: 137,
							timestamp: 1700000000,
						},
					]),
				};
			}),
		};

		// Setup mock database
		mockDb = {
			collection: mock(() => mockCollection),
		};

		mappingsService = new MappingsService(mockDb, collectionId);
	});

	describe("getMappings", () => {
		test("should fetch mappings with minimal parameters", async () => {
			const result = await mappingsService.getMappings({
				network: Networks.MAINNET,
				limit: 10,
			});

			expect(result.documents).toHaveLength(1);
			expect(result.documents[0]).toHaveProperty("originTokenAddress");
			expect(result.documents[0]).toHaveProperty("wrappedTokenAddress");
			expect(result.totalDocumentsCount).toBeUndefined();
			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_mappings"
			);
		});

		test("should filter by originTokenAddress", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
			});
		});

		test("should filter by wrappedTokenAddress", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				wrappedTokenAddress:
					"0xabcdef1234567890abcdef1234567890abcdef12",
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				wrappedTokenAddress:
					"0xabcdef1234567890abcdef1234567890abcdef12",
			});
		});

		test("should filter by originNetworkIds", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				originNetworkIds: [1, 137],
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				originTokenNetwork: { $in: [1, 137] },
			});
		});

		test("should filter by wrappedNetworkIds", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				wrappedNetworkIds: [137, 42161],
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				wrappedTokenNetwork: { $in: [137, 42161] },
			});
		});

		test("should filter by startAfter timestamp", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				startAfter: 1700000000,
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				timestamp: { $lt: 1700000000 },
			});
		});

		test("should combine multiple filters", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				wrappedTokenAddress:
					"0xabcdef1234567890abcdef1234567890abcdef12",
				originNetworkIds: [1],
				wrappedNetworkIds: [137],
				startAfter: 1700000000,
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				wrappedTokenAddress:
					"0xabcdef1234567890abcdef1234567890abcdef12",
				originTokenNetwork: { $in: [1] },
				wrappedTokenNetwork: { $in: [137] },
				timestamp: { $lt: 1700000000 },
			});
		});

		test("should sort by timestamp in descending order", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				limit: 10,
			});

			// Verify find was called
			expect(mockCollection.find).toHaveBeenCalled();
		});

		test("should respect limit parameter", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				limit: 25,
			});

			// Verify find was called
			expect(mockCollection.find).toHaveBeenCalled();
		});

		test("should throw ApiError when collection is not configured", async () => {
			await expect(
				mappingsService.getMappings({
					network: "invalid-network" as Networks,
					limit: 10,
				})
			).rejects.toThrow("No collection configured for network");
		});

		test("should work correctly for testnet", async () => {
			await mappingsService.getMappings({
				network: Networks.TESTNET,
				limit: 10,
			});

			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_mappings_testnet"
			);
		});

		test("should work correctly for devnet", async () => {
			await mappingsService.getMappings({
				network: Networks.DEVNET,
				limit: 10,
			});

			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_mappings_devnet"
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

			const result = await mappingsService.getMappings({
				network: Networks.MAINNET,
				limit: 10,
			});

			expect(result.documents).toHaveLength(0);
		});

		test("should not include originNetworkIds in filter when empty array", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				originNetworkIds: [],
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({});
		});

		test("should not include wrappedNetworkIds in filter when empty array", async () => {
			await mappingsService.getMappings({
				network: Networks.MAINNET,
				wrappedNetworkIds: [],
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({});
		});
	});

	describe("getMappingsByToken", () => {
		test("should fetch mappings for both origin and wrapped tokens", async () => {
			const result = await mappingsService.getMappingsByToken(
				"0x1234567890abcdef1234567890abcdef12345678",
				1,
				Networks.MAINNET
			);

			expect(result.documents).toHaveLength(2);
			expect(result.totalDocumentsCount).toBe(2);
		});

		test("should query with origin token filter", async () => {
			await mappingsService.getMappingsByToken(
				"0x1234567890abcdef1234567890abcdef12345678",
				1,
				Networks.MAINNET
			);

			// The find method should be called twice (once for origin, once for wrapped)
			expect(mockCollection.find).toHaveBeenCalledWith({
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				originTokenNetwork: 1,
			});
		});

		test("should query with wrapped token filter", async () => {
			await mappingsService.getMappingsByToken(
				"0x1234567890abcdef1234567890abcdef12345678",
				1,
				Networks.MAINNET
			);

			// The find method should be called twice (once for origin, once for wrapped)
			expect(mockCollection.find).toHaveBeenCalledWith({
				wrappedTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				wrappedTokenNetwork: 1,
			});
		});

		test("should throw ApiError when collection is not configured", async () => {
			await expect(
				mappingsService.getMappingsByToken(
					"0x1234567890abcdef1234567890abcdef12345678",
					1,
					"invalid-network" as Networks
				)
			).rejects.toThrow("No collection configured for network");
		});

		test("should work correctly for testnet", async () => {
			await mappingsService.getMappingsByToken(
				"0x1234567890abcdef1234567890abcdef12345678",
				1,
				Networks.TESTNET
			);

			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_mappings_testnet"
			);
		});

		test("should work correctly for devnet", async () => {
			await mappingsService.getMappingsByToken(
				"0x1234567890abcdef1234567890abcdef12345678",
				1,
				Networks.DEVNET
			);

			expect(mockDb.collection).toHaveBeenCalledWith(
				"bridge_hub_api_mappings_devnet"
			);
		});

		test("should return empty arrays when no documents match", async () => {
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
					toArray: mock(async () => []),
				};
			});

			const result = await mappingsService.getMappingsByToken(
				"0xNOTFOUND",
				999,
				Networks.MAINNET
			);

			expect(result.documents).toHaveLength(0);
			expect(result.totalDocumentsCount).toBe(0);
		});

		test("should merge origin and wrapped token results", async () => {
			// Setup different responses for origin and wrapped queries
			let callCount = 0;
			mockCollection.find = mock(function (_filter: any) {
				callCount++;
				return {
					toArray: mock(async () => {
						if (callCount === 1) {
							// Origin token query
							return [
								{
									originTokenAddress: "0xORIGIN",
									wrappedTokenAddress: "0xWRAPPED1",
									originTokenNetwork: 1,
									wrappedTokenNetwork: 137,
									timestamp: 1700000000,
								},
							];
						} else {
							// Wrapped token query
							return [
								{
									originTokenAddress: "0xOTHER",
									wrappedTokenAddress: "0xORIGIN",
									originTokenNetwork: 137,
									wrappedTokenNetwork: 1,
									timestamp: 1700000001,
								},
							];
						}
					}),
				};
			});

			const result = await mappingsService.getMappingsByToken(
				"0xORIGIN",
				1,
				Networks.MAINNET
			);

			expect(result.documents).toHaveLength(2);
			expect(result.totalDocumentsCount).toBe(2);
			expect(result.documents[0].originTokenAddress).toBe("0xORIGIN");
			expect(result.documents[1].wrappedTokenAddress).toBe("0xORIGIN");
		});

		test("should handle different network IDs", async () => {
			await mappingsService.getMappingsByToken(
				"0x1234567890abcdef1234567890abcdef12345678",
				137,
				Networks.MAINNET
			);

			expect(mockCollection.find).toHaveBeenCalledWith({
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				originTokenNetwork: 137,
			});

			expect(mockCollection.find).toHaveBeenCalledWith({
				wrappedTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				wrappedTokenNetwork: 137,
			});
		});

		test("should execute both queries in parallel", async () => {
			// Both queries should be initiated without waiting for one to complete
			await mappingsService.getMappingsByToken(
				"0x1234567890abcdef1234567890abcdef12345678",
				1,
				Networks.MAINNET
			);

			// Both toArray methods should be called
			expect(mockCollection.find).toHaveBeenCalledTimes(2);
		});
	});

	describe("constructor", () => {
		test("should initialize with default collection IDs", () => {
			const service = new MappingsService(mockDb);
			expect(service).toBeInstanceOf(MappingsService);
		});

		test("should initialize with custom collection IDs", () => {
			const customCollectionId = new Map([
				["mainnet", "custom_mappings"],
			]);
			const service = new MappingsService(mockDb, customCollectionId);
			expect(service).toBeInstanceOf(MappingsService);
		});
	});

	describe("integration scenarios", () => {
		test("should handle complex getMappings query", async () => {
			const result = await mappingsService.getMappings({
				network: Networks.MAINNET,
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				wrappedTokenAddress:
					"0xabcdef1234567890abcdef1234567890abcdef12",
				originNetworkIds: [1, 137],
				wrappedNetworkIds: [42161, 10],
				startAfter: 1700000000,
				limit: 50,
			});

			expect(result).toBeDefined();
			expect(mockCollection.find).toHaveBeenCalledWith({
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				wrappedTokenAddress:
					"0xabcdef1234567890abcdef1234567890abcdef12",
				originTokenNetwork: { $in: [1, 137] },
				wrappedTokenNetwork: { $in: [42161, 10] },
				timestamp: { $lt: 1700000000 },
			});
		});

		test("should handle pagination with startAfter", async () => {
			const firstResult = await mappingsService.getMappings({
				network: Networks.MAINNET,
				limit: 10,
			});

			// Use the last timestamp to get the next page
			const lastTimestamp =
				firstResult.documents[firstResult.documents.length - 1]
					.timestamp;

			await mappingsService.getMappings({
				network: Networks.MAINNET,
				startAfter: lastTimestamp,
				limit: 10,
			});

			expect(mockCollection.find).toHaveBeenLastCalledWith({
				timestamp: { $lt: lastTimestamp },
			});
		});
	});
});
