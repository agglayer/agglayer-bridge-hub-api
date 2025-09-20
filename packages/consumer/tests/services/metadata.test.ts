import { describe, test, expect, beforeEach, mock } from "bun:test";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import MetadataService from "../../src/services/metadata";
import type { IHubMetadata } from "../../src/interfaces/metadata";

const mockUpdateDocuments = mock((_params: any) => Promise.resolve());
const mockGetDocument = mock((_params: any) => Promise.resolve({}));

const mockDatabase = {
	updateDocuments: mockUpdateDocuments,
	getDocument: mockGetDocument,
} as unknown as DatabaseClient;

describe("MetadataService", () => {
	let service: MetadataService;
	const mockCollectionId = "test_metadata";
	const mockDocId = "test_lastIndexedTransactions";

	beforeEach(() => {
		service = new MetadataService(
			mockDatabase,
			mockCollectionId,
			mockDocId
		);
		mockUpdateDocuments.mockClear();
		mockGetDocument.mockClear();
	});

	describe("constructor", () => {
		test("should initialize with default collection and doc IDs", () => {
			const defaultService = new MetadataService(mockDatabase);
			expect(defaultService).toBeInstanceOf(MetadataService);
		});

		test("should initialize with custom collection ID only", () => {
			const customService = new MetadataService(
				mockDatabase,
				"custom_collection"
			);
			expect(customService).toBeInstanceOf(MetadataService);
		});

		test("should initialize with custom collection and doc IDs", () => {
			const customService = new MetadataService(
				mockDatabase,
				"custom_collection",
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

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: [mockCollectionId],
				docDatas: [metadata],
				docIds: [mockDocId],
			});
		});

		test("should save metadata with claim block number", async () => {
			const metadata: IHubMetadata = {
				lastIndexedClaimBlockNumber: 50000,
			};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: [mockCollectionId],
				docDatas: [metadata],
				docIds: [mockDocId],
			});
		});

		test("should save metadata with mapping block number", async () => {
			const metadata: IHubMetadata = {
				lastIndexedMappingBlockNumber: 60000,
			};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: [mockCollectionId],
				docDatas: [metadata],
				docIds: [mockDocId],
			});
		});

		test("should save metadata with all fields", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 100,
				lastIndexedClaimBlockNumber: 50000,
				lastIndexedMappingBlockNumber: 60000,
			};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: [mockCollectionId],
				docDatas: [metadata],
				docIds: [mockDocId],
			});

			expect(mockUpdateDocuments).toHaveBeenCalledTimes(1);
		});

		test("should save empty metadata object", async () => {
			const metadata: IHubMetadata = {};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: [mockCollectionId],
				docDatas: [metadata],
				docIds: [mockDocId],
			});
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

			mockGetDocument.mockResolvedValueOnce(mockMetadata);

			const result = await service.getLastIndexedTxs();

			expect(mockGetDocument).toHaveBeenCalledWith({
				collectionId: mockCollectionId,
				docId: mockDocId,
			});

			expect(result).toBe(mockMetadata);
		});

		test("should handle empty metadata response", async () => {
			const emptyMetadata = {};
			mockGetDocument.mockResolvedValueOnce(emptyMetadata);

			const result = await service.getLastIndexedTxs();

			expect(result).toBe(emptyMetadata);
		});

		test("should handle null response from database", async () => {
			mockGetDocument.mockResolvedValueOnce(null as any);

			const result = await service.getLastIndexedTxs();

			expect(result).toBeNull();
		});

		test("should handle undefined response from database", async () => {
			mockGetDocument.mockResolvedValueOnce(undefined as any);

			const result = await service.getLastIndexedTxs();

			expect(result).toBeUndefined();
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

			mockGetDocument.mockResolvedValueOnce(complexMetadata);

			const result = await service.getLastIndexedTxs();

			expect(result).toBe(complexMetadata);
			expect(result).toEqual(complexMetadata);
		});
	});

	describe("integration with different constructor parameters", () => {
		test("should work with default collection and doc IDs", async () => {
			const defaultService = new MetadataService(mockDatabase);
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 42,
			};

			await defaultService.saveLastIndexedTxs(metadata);

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: ["bridge_hub_api_metadata"],
				docDatas: [metadata],
				docIds: ["lastIndexedTransactions"],
			});
		});

		test("should work with custom collection ID and default doc ID", async () => {
			const customService = new MetadataService(
				mockDatabase,
				"custom_metadata"
			);
			const metadata: IHubMetadata = { lastIndexedClaimBlockNumber: 789 };

			await customService.saveLastIndexedTxs(metadata);

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: ["custom_metadata"],
				docDatas: [metadata],
				docIds: ["lastIndexedTransactions"],
			});
		});

		test("should get document with custom parameters", async () => {
			const customService = new MetadataService(
				mockDatabase,
				"custom_collection",
				"custom_doc"
			);

			mockGetDocument.mockResolvedValueOnce({ test: "data" });

			await customService.getLastIndexedTxs();

			expect(mockGetDocument).toHaveBeenCalledWith({
				collectionId: "custom_collection",
				docId: "custom_doc",
			});
		});
	});

	describe("edge cases", () => {
		test("should handle very large numbers", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: Number.MAX_SAFE_INTEGER,
				lastIndexedClaimBlockNumber: 999999999999,
			};

			await service.saveLastIndexedTxs(metadata);

			expect(mockUpdateDocuments).toHaveBeenCalledWith({
				collectionPaths: [mockCollectionId],
				docDatas: [metadata],
				docIds: [mockDocId],
			});
		});

		test("should handle zero values", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 0,
				lastIndexedClaimBlockNumber: 0,
				lastIndexedMappingBlockNumber: 0,
			};

			await service.saveLastIndexedTxs(metadata);

			const call = mockUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docDatas[0]).toEqual(metadata);
		});

		test("should handle negative values", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: -1,
				lastIndexedClaimBlockNumber: -100,
			};

			await service.saveLastIndexedTxs(metadata);

			const call = mockUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docDatas[0]).toEqual(metadata);
		});

		test("should maintain object reference integrity", async () => {
			const metadata: IHubMetadata = {
				lastIndexedBridgeDepositCount: 100,
			};

			await service.saveLastIndexedTxs(metadata);

			const call = mockUpdateDocuments.mock.calls[0]?.[0];
			expect(call?.docDatas[0]).toBe(metadata); // Same reference
		});
	});
});
