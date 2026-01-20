import { describe, test, expect, beforeEach, mock, beforeAll } from "bun:test";
import { Logger } from "@polygonlabs/servercore";
import MetadataService from "../../src/services/metadata";
import type { IHubMetadata } from "../../src/interfaces/metadata";

// Initialize Logger for tests
beforeAll(() => {
	Logger.create({});
});

const mockUpdateOne = mock((_filter: any, _update: any) => Promise.resolve({}));
const mockFindOne = mock((_filter: any) => Promise.resolve({}));

const mockCollection = {
	updateOne: mockUpdateOne,
	findOne: mockFindOne,
	collectionName: "test_metadata",
	dbName: "test_db",
} as any;

describe("MetadataService", () => {
	let service: MetadataService;
	const mockDocId = "test_lastIndexedTransactions";

	beforeEach(() => {
		service = new MetadataService(mockCollection, mockDocId);
		mockUpdateOne.mockClear();
		mockFindOne.mockClear();
	});

	describe("constructor", () => {
		test("should initialize with default doc ID", () => {
			const defaultService = new MetadataService(mockCollection);
			expect(defaultService).toBeInstanceOf(MetadataService);
		});

		test("should initialize with custom doc ID", () => {
			const customService = new MetadataService(
				mockCollection,
				"custom_doc"
			);
			expect(customService).toBeInstanceOf(MetadataService);
		});
	});

	describe("saveLastIndexedTxs", () => {
		test("should save metadata with bridge deposit count", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 100,
			};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]).toEqual({ _id: mockDocId });
			expect(call[1].$set).toEqual(metadata);
			expect(call[1].$setOnInsert).toEqual({ _id: mockDocId });
		});

		test("should save metadata with claim block number", async () => {
			const metadata: IHubMetadata = {
				lastIndexedClaimBlockNumber: 50000,
			};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]).toEqual({ _id: mockDocId });
			expect(call[1].$set).toEqual(metadata);
		});

		test("should save metadata with mapping block number", async () => {
			const metadata: IHubMetadata = {
				lastIndexedMappingBlockNumber: 60000,
			};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]).toEqual({ _id: mockDocId });
			expect(call[1].$set).toEqual(metadata);
		});

		test("should save metadata with all fields", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 100,
				lastIndexedClaimBlockNumber: 50000,
				lastIndexedMappingBlockNumber: 60000,
			};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateOne).toHaveBeenCalled();
			expect(mockUpdateOne).toHaveBeenCalledTimes(1);
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]).toEqual({ _id: mockDocId });
			expect(call[1].$set).toEqual(metadata);
		});

		test("should save empty metadata object", async () => {
			const metadata: IHubMetadata = {};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]).toEqual({ _id: mockDocId });
			expect(call[1].$set).toEqual(metadata);
		});

		test("should handle database promise without throwing", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 123,
			};

			// Test that it doesn't throw
			expect(
				service.saveLastIndexedTxs(metadata)
			).resolves.toBeUndefined();
		});
	});

	describe("getLastIndexedTxs", () => {
		test("should get metadata and cast to IHubMetadata", async () => {
			const mockMetadata = {
				lastIndexedBridgeDepositCount: 100,
				lastIndexedClaimBlockNumber: 50000,
			};

			mockFindOne.mockResolvedValueOnce(mockMetadata);

			const result = await service.getLastIndexedTxs();

			expect(mockFindOne).toHaveBeenCalledWith({ _id: mockDocId });

			expect(result).toEqual(mockMetadata);
		});

		test("should handle empty metadata response", async () => {
			const emptyMetadata = {};
			mockFindOne.mockResolvedValueOnce(emptyMetadata);

			const result = await service.getLastIndexedTxs();

			expect(result).toEqual(emptyMetadata);
		});

		test("should handle null response from database", async () => {
			mockFindOne.mockResolvedValueOnce(null as any);

			const result = await service.getLastIndexedTxs();

			expect(result).toEqual({});
		});

		test("should handle undefined response from database", async () => {
			mockFindOne.mockResolvedValueOnce(undefined as any);

			const result = await service.getLastIndexedTxs();

			expect(result).toEqual({});
		});

		test("should pass through database response without modification", async () => {
			const complexMetadata = {
				lastIndexedBridgeDepositCount: 999,
				lastIndexedClaimBlockNumber: 123456,
				lastIndexedMappingBlockNumber: 789012,
				extraField: "should be preserved",
				nestedObject: {
					prop: "value",
				},
			};

			mockFindOne.mockResolvedValueOnce(complexMetadata);

			const result = await service.getLastIndexedTxs();

			expect(result).toEqual(complexMetadata);
		});
	});

	describe("integration with different constructor parameters", () => {
		test("should work with default collection and doc IDs", async () => {
			const defaultService = new MetadataService(mockCollection);
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 42,
			};

			await defaultService.saveLastIndexedTxs(metadata);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]).toEqual({ _id: "lastIndexedTransactions" });
			expect(call[1].$set).toEqual(metadata);
		});

		test("should work with custom doc ID", async () => {
			const customService = new MetadataService(
				mockCollection,
				"custom_metadata"
			);
			const metadata: IHubMetadata = { lastIndexedClaimBlockNumber: 789 };

			await customService.saveLastIndexedTxs(metadata);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[0]).toEqual({ _id: "custom_metadata" });
			expect(call[1].$set).toEqual(metadata);
		});

		test("should get document with custom doc ID", async () => {
			const customService = new MetadataService(
				mockCollection,
				"custom_doc"
			);

			mockFindOne.mockResolvedValueOnce({ test: "data" });

			await customService.getLastIndexedTxs();

			expect(mockFindOne).toHaveBeenCalledWith({ _id: "custom_doc" });
		});
	});

	describe("edge cases", () => {
		test("should handle very large numbers", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: Number.MAX_SAFE_INTEGER,
				lastIndexedClaimBlockNumber: 999999999999,
			};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateOne).toHaveBeenCalled();
			const call = mockUpdateOne.mock.calls[0];
			expect(call[1].$set).toEqual(metadata);
		});

		test("should handle zero values", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 0,
				lastIndexedClaimBlockNumber: 0,
				lastIndexedMappingBlockNumber: 0,
			};

			await service.saveLastIndexedTxs(metadata);

			const call = mockUpdateOne.mock.calls[0];
			expect(call[1].$set).toEqual(metadata);
		});

		test("should handle negative values", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: -1,
				lastIndexedClaimBlockNumber: -100,
			};

			await service.saveLastIndexedTxs(metadata);

			const call = mockUpdateOne.mock.calls[0];
			expect(call[1].$set).toEqual(metadata);
		});

		test("should maintain object reference integrity", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 100,
			};

			await service.saveLastIndexedTxs(metadata);

			const call = mockUpdateOne.mock.calls[0];
			expect(call[1].$set).toEqual(metadata);
		});
	});
});
