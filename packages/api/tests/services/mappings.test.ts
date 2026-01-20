import { describe, test, expect, beforeEach, mock } from "bun:test";
import { MappingsService } from "../../src/services/mappings";
import { mockServiceResponse } from "../test-utils";
import type { Db, Collection } from "mongodb";

// Mock executeMongoOperation to simply execute the callback
mock.module("@agglayer/bridge-hub-commons", () => ({
	executeMongoOperation: async (collection: any, callback: any) => {
		return await callback(collection);
	},
}));

// Mock MongoDB Collection methods
const mockToArray = mock(() => Promise.resolve(mockServiceResponse.documents));

const mockFind = mock(() => ({
	// For direct toArray() calls (used in getMappingsByToken)
	toArray: mockToArray,
	// For chained sort().limit().toArray() calls (used in getMappings)
	sort: mock(() => ({
		limit: mock(() => ({
			toArray: mockToArray,
		})),
	})),
}));

const mockCollection = {
	find: mockFind,
	collectionName: "bridge_hub_api_mappings_testnet",
} as unknown as Collection;

// Mock MongoDB Db
const mockDatabase = {
	collection: mock(() => mockCollection),
} as unknown as Db;

describe("MappingsService", () => {
	beforeEach(() => {
		mockFind.mockClear();
		mockToArray.mockClear();
		(mockDatabase.collection as any).mockClear();
	});

	describe("initializeMappingsService", () => {
		test("should initialize successfully and throw error on reinitialize", () => {
			// First initialization should succeed
			MappingsService.initializeMappingsService(mockDatabase);

			// Second initialization should throw error
			expect(() =>
				MappingsService.initializeMappingsService(mockDatabase)
			).toThrow("MappingsService is already initialized");

			// Also verify custom collection IDs can be passed (tested with default above)
			const customCollectionMap = new Map([
				["mainnet", "custom_mappings"],
				["testnet", "custom_mappings_testnet"],
			]);
			expect(() =>
				MappingsService.initializeMappingsService(
					mockDatabase,
					customCollectionMap
				)
			).toThrow("MappingsService is already initialized");
		});
	});

	describe("getMappings", () => {
		test("should handle empty network IDs arrays", async () => {
			const params = {
				originNetworkIds: [],
				wrappedNetworkIds: [],
				network: "testnet",
			};

			await MappingsService.getMappings(params);

			expect(mockFind).toHaveBeenCalled();
			const filterArg = (mockFind.mock.calls as any)[0][0];

			// Should not include network ID filters when arrays are empty
			expect(filterArg.originTokenNetwork).toBeUndefined();
			expect(filterArg.wrappedTokenNetwork).toBeUndefined();
		});

		test("should handle undefined network IDs", async () => {
			const params = {
				originNetworkIds: undefined,
				wrappedNetworkIds: undefined,
				network: "testnet",
			};

			await MappingsService.getMappings(params);

			const filterArg = (mockFind.mock.calls as any)[0][0];

			// Should not include network ID filters when undefined
			expect(filterArg.originTokenNetwork).toBeUndefined();
			expect(filterArg.wrappedTokenNetwork).toBeUndefined();
		});

		test("should only add filters for truthy values", async () => {
			const params = {
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				wrappedTokenAddress: "", // Empty string should not be included
				originNetworkIds: [1, 2],
				wrappedNetworkIds: null, // Null should not be included
				network: "testnet",
			};

			await MappingsService.getMappings(params as any);

			const filterArg = (mockFind.mock.calls as any)[0][0];

			// Should include origin token address and origin network IDs
			expect(filterArg.originTokenAddress).toBe(
				params.originTokenAddress
			);
			expect(filterArg.originTokenNetwork).toEqual({
				$in: params.originNetworkIds,
			});

			// Should not include wrapped token address or wrapped network IDs
			expect(filterArg.wrappedTokenAddress).toBeUndefined();
			expect(filterArg.wrappedTokenNetwork).toBeUndefined();
		});

		test("should return database response", async () => {
			const params = { network: "testnet" };
			const result = await MappingsService.getMappings(params);

			expect(result).toEqual({
				documents: mockServiceResponse.documents,
				totalDocumentsCount: undefined,
			});
		});

		test("should handle all filter parameters", async () => {
			const params = {
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				wrappedTokenAddress:
					"0xabcdef1234567890abcdef1234567890abcdef12",
				originNetworkIds: [1, 2],
				wrappedNetworkIds: [137, 42],
				network: "testnet",
				startAfter: 1700000000,
			};

			await MappingsService.getMappings(params);

			const filterArg = (mockFind.mock.calls as any)[0][0];

			expect(filterArg).toEqual({
				originTokenAddress: params.originTokenAddress,
				wrappedTokenAddress: params.wrappedTokenAddress,
				originTokenNetwork: { $in: params.originNetworkIds },
				wrappedTokenNetwork: { $in: params.wrappedNetworkIds },
				timestamp: { $lt: params.startAfter },
			});
		});
	});

	describe("getMappingsByToken", () => {
		test("should make two separate queries for origin and wrapped tokens", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const tokenNetwork = "1";
			const network = "testnet";

			await MappingsService.getMappingsByToken(
				tokenAddress,
				tokenNetwork,
				network
			);

			// Should make two separate calls - one for origin tokens and one for wrapped tokens
			expect(mockFind).toHaveBeenCalledTimes(2);

			// First call should be for origin tokens
			const firstCallFilter = (mockFind.mock.calls as any)[0][0];
			expect(firstCallFilter).toEqual({
				originTokenAddress: tokenAddress,
				originTokenNetwork: 1,
			});

			// Second call should be for wrapped tokens
			const secondCallFilter = (mockFind.mock.calls as any)[1][0];
			expect(secondCallFilter).toEqual({
				wrappedTokenAddress: tokenAddress,
				wrappedTokenNetwork: 1,
			});
		});

		test("should handle null tokenAddress", async () => {
			const tokenAddress = null;
			const tokenNetwork = "1";
			const network = "testnet";

			await MappingsService.getMappingsByToken(
				tokenAddress as any,
				tokenNetwork,
				network
			);

			// Should still make two separate calls even with null tokenAddress
			expect(mockFind).toHaveBeenCalledTimes(2);

			const firstCallFilter = (mockFind.mock.calls as any)[0][0];
			expect(firstCallFilter.originTokenAddress).toBeNull();
		});

		test("should handle null tokenNetwork", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const tokenNetwork = null;
			const network = "testnet";

			await MappingsService.getMappingsByToken(
				tokenAddress,
				tokenNetwork as any,
				network
			);

			// Should still make two separate calls even with null tokenNetwork
			expect(mockFind).toHaveBeenCalledTimes(2);

			const firstCallFilter = (mockFind.mock.calls as any)[0][0];
			// Number(null) = 0
			expect(firstCallFilter.originTokenNetwork).toBe(0);
		});

		test("should handle both null parameters", async () => {
			const tokenAddress = null;
			const tokenNetwork = null;
			const network = "testnet";

			await MappingsService.getMappingsByToken(
				tokenAddress as any,
				tokenNetwork as any,
				network
			);

			// Should still make two separate calls even with both nulls
			expect(mockFind).toHaveBeenCalledTimes(2);

			const firstCallFilter = (mockFind.mock.calls as any)[0][0];
			expect(firstCallFilter.originTokenAddress).toBeNull();
			expect(firstCallFilter.originTokenNetwork).toBe(0);
		});

		test("should return combined database response", async () => {
			const result = await MappingsService.getMappingsByToken(
				"0x1234",
				"1",
				"testnet"
			);

			// Should return combined results from both calls
			expect(result).toEqual({
				documents: [
					...mockServiceResponse.documents,
					...mockServiceResponse.documents,
				],
				totalDocumentsCount: mockServiceResponse.documents.length * 2,
			});
		});
	});

	describe("edge cases", () => {
		test("should handle database errors", async () => {
			const error = new Error("Database connection failed");
			mockFind.mockReturnValueOnce({
				sort: () => ({
					limit: () => ({
						toArray: () => Promise.reject(error),
					}),
				}),
			});

			const params = { network: "testnet" };

			await expect(MappingsService.getMappings(params)).rejects.toThrow(
				"Database connection failed"
			);
		});

		test("should work with different network values", async () => {
			const networks = ["mainnet", "testnet"];

			for (const network of networks) {
				await MappingsService.getMappings({ network });

				const expectedCollectionName =
					network === "mainnet"
						? "bridge_hub_api_mappings"
						: "bridge_hub_api_mappings_testnet";

				expect(mockDatabase.collection).toHaveBeenCalledWith(
					expectedCollectionName
				);

				(mockDatabase.collection as any).mockClear();
				mockFind.mockClear();
			}
		});

		test("should handle large network ID arrays", async () => {
			const params = {
				originNetworkIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				wrappedNetworkIds: [137, 42, 80001, 421613, 11155111],
				network: "testnet",
			};

			await MappingsService.getMappings(params);

			const filterArg = (mockFind.mock.calls as any)[0][0];

			expect(filterArg.originTokenNetwork).toEqual({
				$in: params.originNetworkIds,
			});
			expect(filterArg.wrappedTokenNetwork).toEqual({
				$in: params.wrappedNetworkIds,
			});
		});

		test("should throw ApiError when network not configured", async () => {
			expect(
				MappingsService.getMappings({ network: "invalid" })
			).rejects.toThrow("No collection configured for network");
		});
	});
});
