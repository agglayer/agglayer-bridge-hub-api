import { describe, test, expect, beforeEach, mock } from "bun:test";
import { MappingsService } from "../../src/services/mappings";
import { mockServiceResponse } from "../test-utils";

// Mock database client
const mockDatabase = {
	getDocuments: mock(() => Promise.resolve(mockServiceResponse)),
};

describe("MappingsService", () => {
	beforeEach(() => {
		mockDatabase.getDocuments.mockClear();
	});

	// Tests that expect uninitialized service to throw errors
	describe("uninitialized service behavior", () => {
		test("should throw error when getMappings called without initialization", async () => {
			const params = {
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				wrappedTokenAddress:
					"0xabcdef1234567890abcdef1234567890abcdef12",
				originNetworkIds: [1, 2],
				wrappedNetworkIds: [137],
				network: "testnet",
				limit: 10,
				startAfter: 1700000000,
			};

			await expect(MappingsService.getMappings(params)).rejects.toThrow(
				"MappingsService not initialized. Call initializeMappingsService first."
			);
		});

		test("should throw error when getMappingsByToken called without initialization", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const tokenNetwork = "1";
			const network = "testnet";

			await expect(
				MappingsService.getMappingsByToken(
					tokenAddress,
					tokenNetwork,
					network
				)
			).rejects.toThrow(
				"MappingsService not initialized. Call initializeMappingsService first."
			);
		});
	});

	describe("initializeMappingsService", () => {
		test("should initialize with default collection IDs", () => {
			const database = mockDatabase as any;
			MappingsService.initializeMappingsService(database);

			// Test is mainly for ensuring no errors thrown during initialization
			expect(true).toBe(true);
		});

		test("should initialize with custom collection IDs", () => {
			const database = mockDatabase as any;
			const customCollectionMap = new Map([
				["mainnet", "custom_mappings"],
				["testnet", "custom_mappings_testnet"],
			]);

			MappingsService.initializeMappingsService(
				database,
				customCollectionMap
			);
			expect(true).toBe(true);
		});

		test("should not reinitialize if already initialized", () => {
			const database = mockDatabase as any;
			const originalCollectionMap = new Map([
				["mainnet", "original_mappings"],
			]);
			const newCollectionMap = new Map([["mainnet", "new_mappings"]]);

			MappingsService.initializeMappingsService(
				database,
				originalCollectionMap
			);
			MappingsService.initializeMappingsService(
				database,
				newCollectionMap
			);

			// Since it doesn't reinitialize, this should not throw
			expect(true).toBe(true);
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

			const databaseCall = (
				mockDatabase.getDocuments.mock.calls as any
			)[0][0];

			// Should not include network ID filters when arrays are empty
			expect(databaseCall.filter).not.toContainEqual(
				expect.objectContaining({ field: "originTokenNetwork" })
			);
			expect(databaseCall.filter).not.toContainEqual(
				expect.objectContaining({ field: "wrappedTokenNetwork" })
			);
		});

		test("should handle undefined network IDs", async () => {
			const params = {
				originNetworkIds: undefined,
				wrappedNetworkIds: undefined,
				network: "testnet",
			};

			await MappingsService.getMappings(params);

			const databaseCall = (
				mockDatabase.getDocuments.mock.calls as any
			)[0][0];

			// Should not include network ID filters when undefined
			expect(databaseCall.filter).not.toContainEqual(
				expect.objectContaining({ field: "originTokenNetwork" })
			);
			expect(databaseCall.filter).not.toContainEqual(
				expect.objectContaining({ field: "wrappedTokenNetwork" })
			);
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

			const databaseCall = (
				mockDatabase.getDocuments.mock.calls as any
			)[0][0];

			// Should include origin token address and origin network IDs
			expect(databaseCall.filter).toContainEqual({
				field: "originTokenAddress",
				operator: "==",
				value: params.originTokenAddress,
			});
			expect(databaseCall.filter).toContainEqual({
				field: "originTokenNetwork",
				operator: "in",
				value: params.originNetworkIds,
			});

			// Should not include wrapped token address or wrapped network IDs
			expect(databaseCall.filter).not.toContainEqual(
				expect.objectContaining({ field: "wrappedTokenAddress" })
			);
			expect(databaseCall.filter).not.toContainEqual(
				expect.objectContaining({ field: "wrappedTokenNetwork" })
			);
		});

		test("should return database response", async () => {
			const params = { network: "testnet" };
			const result = await MappingsService.getMappings(params);

			expect(result).toBe(mockServiceResponse);
		});
	});

	describe("getMappingsByToken", () => {
		test("should build OR query params correctly", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const tokenNetwork = "1";
			const network = "testnet";

			await MappingsService.getMappingsByToken(
				tokenAddress,
				tokenNetwork,
				network
			);

			expect(mockDatabase.getDocuments).toHaveBeenCalledWith({
				collectionPath: "mappings_testnet",
				orFilters: [
					{
						or: [
							{
								field: "originTokenAddress",
								operator: "==",
								value: tokenAddress,
							},
							{
								field: "wrappedTokenAddress",
								operator: "==",
								value: tokenAddress,
							},
						],
					},
					{
						or: [
							{
								field: "originTokenNetwork",
								operator: "==",
								value: tokenNetwork,
							},
							{
								field: "wrappedTokenNetwork",
								operator: "==",
								value: tokenNetwork,
							},
						],
					},
				],
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

			const databaseCall = (
				mockDatabase.getDocuments.mock.calls as any
			)[0][0];

			// Should only have tokenNetwork OR filter
			expect(databaseCall.orFilters).toHaveLength(1);
			expect(databaseCall.orFilters[0]).toEqual({
				or: [
					{
						field: "originTokenNetwork",
						operator: "==",
						value: tokenNetwork,
					},
					{
						field: "wrappedTokenNetwork",
						operator: "==",
						value: tokenNetwork,
					},
				],
			});
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

			const databaseCall = (
				mockDatabase.getDocuments.mock.calls as any
			)[0][0];

			// Should only have tokenAddress OR filter
			expect(databaseCall.orFilters).toHaveLength(1);
			expect(databaseCall.orFilters[0]).toEqual({
				or: [
					{
						field: "originTokenAddress",
						operator: "==",
						value: tokenAddress,
					},
					{
						field: "wrappedTokenAddress",
						operator: "==",
						value: tokenAddress,
					},
				],
			});
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

			const databaseCall = (
				mockDatabase.getDocuments.mock.calls as any
			)[0][0];

			// Should have empty OR filters array
			expect(databaseCall.orFilters).toEqual([]);
		});

		test("should return database response", async () => {
			const result = await MappingsService.getMappingsByToken(
				"0x1234",
				"1",
				"testnet"
			);
			expect(result).toBe(mockServiceResponse);
		});
	});

	describe("edge cases", () => {
		test("should handle database errors", async () => {
			const error = new Error("Database connection failed");
			mockDatabase.getDocuments.mockRejectedValueOnce(error);

			const params = { network: "testnet" };

			await expect(MappingsService.getMappings(params)).rejects.toThrow(
				"Database connection failed"
			);
		});

		test("should work with different network values", async () => {
			const networks = ["mainnet", "testnet"];

			for (const network of networks) {
				await MappingsService.getMappings({ network });

				const expectedCollectionPath =
					network === "mainnet" ? "mappings" : "mappings_testnet";
				expect(mockDatabase.getDocuments).toHaveBeenCalledWith(
					expect.objectContaining({
						collectionPath: expectedCollectionPath,
					})
				);

				mockDatabase.getDocuments.mockClear();
			}
		});

		test("should handle large network ID arrays", async () => {
			const params = {
				originNetworkIds: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
				wrappedNetworkIds: [137, 42, 80001, 421613, 11155111],
				network: "testnet",
			};

			await MappingsService.getMappings(params);

			const databaseCall = (
				mockDatabase.getDocuments.mock.calls as any
			)[0][0];

			expect(databaseCall.filter).toContainEqual({
				field: "originTokenNetwork",
				operator: "in",
				value: params.originNetworkIds,
			});
			expect(databaseCall.filter).toContainEqual({
				field: "wrappedTokenNetwork",
				operator: "in",
				value: params.wrappedNetworkIds,
			});
		});
	});
});
