import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
	getMappings,
	getMappingsByToken,
} from "../../src/controllers/mappings";
import {
	createMockContext,
	mockMappingsQuery,
	mockServiceResponse,
	clearAllMocks,
} from "../test-utils";

// Mock the services and servercore functions
const mockMappingsService = {
	getMappings: mock(() => Promise.resolve(mockServiceResponse)),
	getMappingsByToken: mock(() => Promise.resolve(mockServiceResponse)),
};

const mockHandleResponse = mock((context: any, data: any, meta?: any) => ({
	success: true,
	data,
	meta,
	context,
}));

const mockGetResponseContext = mock(() => ({
	requestId: "test-request-id",
}));

// Mock the imports
mock.module("../../src/services/mappings", () => ({
	MappingsService: mockMappingsService,
}));

mock.module("@polygonlabs/servercore", () => ({
	handleResponse: mockHandleResponse,
}));

mock.module("../../src/middlewares/response_context", () => ({
	getResponseContext: mockGetResponseContext,
}));

describe("Mappings Controller", () => {
	beforeEach(() => {
		clearAllMocks();
		mockMappingsService.getMappings.mockClear();
		mockMappingsService.getMappingsByToken.mockClear();
		mockHandleResponse.mockClear();
		mockGetResponseContext.mockClear();
	});

	describe("getMappings", () => {
		test("should call MappingsService.getMappings with correct parameters", async () => {
			const mockContext = createMockContext({
				validatedQuery: mockMappingsQuery,
				validatedParams: { network: "testnet" },
			});

			await getMappings(mockContext);

			expect(mockMappingsService.getMappings).toHaveBeenCalledWith({
				network: "testnet",
				originTokenAddress: mockMappingsQuery.originTokenAddress,
				wrappedTokenAddress: mockMappingsQuery.wrappedTokenAddress,
				originNetworkIds: mockMappingsQuery.originNetworkIds,
				wrappedNetworkIds: mockMappingsQuery.wrappedNetworkIds,
				limit: mockMappingsQuery.limit,
				startAfter: mockMappingsQuery.startAfter,
			});
		});

		test("should handle empty query parameters", async () => {
			const mockContext = createMockContext({
				validatedQuery: {},
				validatedParams: { network: "mainnet" },
			});

			await getMappings(mockContext);

			expect(mockMappingsService.getMappings).toHaveBeenCalledWith({
				network: "mainnet",
				originTokenAddress: undefined,
				wrappedTokenAddress: undefined,
				originNetworkIds: undefined,
				wrappedNetworkIds: undefined,
				limit: undefined,
				startAfter: undefined,
			});
		});

		test("should call handleResponse with correct parameters", async () => {
			const mockContext = createMockContext({
				validatedQuery: mockMappingsQuery,
				validatedParams: { network: "testnet" },
			});

			await getMappings(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				mockServiceResponse.documents,
				{
					total: mockServiceResponse.totalDocumentsCount,
					limit: mockMappingsQuery.limit,
					nextStartAfterCursor:
						mockServiceResponse.documents.at(-1)?.timestamp,
				}
			);
		});

		test("should handle query without offset", async () => {
			const queryWithoutOffset = { ...mockMappingsQuery };
			delete (queryWithoutOffset as any).offset;

			const mockContext = createMockContext({
				validatedQuery: queryWithoutOffset,
				validatedParams: { network: "testnet" },
			});

			await getMappings(mockContext);

			const handleResponseCall = mockHandleResponse.mock.calls[0];
			const metaParam = handleResponseCall[2];

			expect(metaParam.nextStartAfterCursor).toBeDefined();
			expect(metaParam.nextStartAfterCursor).toBe(
				mockServiceResponse.documents.at(-1)?.timestamp
			);
		});

		test("should not set nextStartAfterCursor when offset is defined", async () => {
			const queryWithOffset = { ...mockMappingsQuery, offset: 10 };

			const mockContext = createMockContext({
				validatedQuery: queryWithOffset,
				validatedParams: { network: "testnet" },
			});

			await getMappings(mockContext);

			const handleResponseCall = mockHandleResponse.mock.calls[0];
			const metaParam = handleResponseCall[2];

			expect(metaParam.nextStartAfterCursor).toBeUndefined();
		});

		test("should handle service response without documents", async () => {
			const emptyResponse = { documents: [], totalDocumentsCount: 0 };
			mockMappingsService.getMappings.mockResolvedValueOnce(
				emptyResponse
			);

			const mockContext = createMockContext({
				validatedQuery: mockMappingsQuery,
				validatedParams: { network: "testnet" },
			});

			await getMappings(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				emptyResponse.documents,
				{
					total: 0,
					limit: mockMappingsQuery.limit,
					nextStartAfterCursor: undefined,
				}
			);
		});

		test("should handle service response without totalDocumentsCount", async () => {
			const responseWithoutCount = {
				documents: mockServiceResponse.documents,
			};
			mockMappingsService.getMappings.mockResolvedValueOnce(
				responseWithoutCount as any
			);

			const mockContext = createMockContext({
				validatedQuery: mockMappingsQuery,
				validatedParams: { network: "testnet" },
			});

			await getMappings(mockContext);

			const handleResponseCall = mockHandleResponse.mock.calls[0];
			const metaParam = handleResponseCall[2];

			expect(metaParam.total).toBe(0);
		});
	});

	describe("getMappingsByToken", () => {
		test("should call MappingsService.getMappingsByToken with correct parameters", async () => {
			const mockContext = createMockContext({
				validatedQuery: { limit: 10 },
				validatedParams: {
					tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
					tokenNetwork: 1,
					network: "testnet",
				},
			});

			await getMappingsByToken(mockContext);

			expect(mockMappingsService.getMappingsByToken).toHaveBeenCalledWith(
				"0x1234567890abcdef1234567890abcdef12345678",
				1,
				"testnet"
			);
		});

		test("should handle undefined tokenAddress and tokenNetwork", async () => {
			const mockContext = createMockContext({
				validatedQuery: { limit: 5 },
				validatedParams: {
					tokenAddress: undefined,
					tokenNetwork: undefined,
					network: "mainnet",
				},
			});

			await getMappingsByToken(mockContext);

			expect(mockMappingsService.getMappingsByToken).toHaveBeenCalledWith(
				undefined,
				undefined,
				"mainnet"
			);
		});

		test("should call handleResponse with correct parameters", async () => {
			const mockContext = createMockContext({
				validatedQuery: { limit: 20 },
				validatedParams: {
					tokenAddress: "0xabcd1234",
					tokenNetwork: 137,
					network: "testnet",
				},
			});

			await getMappingsByToken(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				mockServiceResponse.documents,
				{
					total: mockServiceResponse.totalDocumentsCount,
					limit: 20,
					nextStartAfterCursor:
						mockServiceResponse.documents.at(-1)?.timestamp,
				}
			);
		});

		test("should handle query without offset for token mappings", async () => {
			const mockContext = createMockContext({
				validatedQuery: { limit: 10 },
				validatedParams: {
					tokenAddress: "0x1234",
					tokenNetwork: 1,
					network: "testnet",
				},
			});

			await getMappingsByToken(mockContext);

			const handleResponseCall = mockHandleResponse.mock.calls[0];
			const metaParam = handleResponseCall[2];

			expect(metaParam.nextStartAfterCursor).toBeDefined();
			expect(metaParam.nextStartAfterCursor).toBe(
				mockServiceResponse.documents.at(-1)?.timestamp
			);
		});

		test("should not set nextStartAfterCursor when offset is defined for token mappings", async () => {
			const mockContext = createMockContext({
				validatedQuery: { limit: 10, offset: 5 },
				validatedParams: {
					tokenAddress: "0x1234",
					tokenNetwork: 1,
					network: "testnet",
				},
			});

			await getMappingsByToken(mockContext);

			const handleResponseCall = mockHandleResponse.mock.calls[0];
			const metaParam = handleResponseCall[2];

			expect(metaParam.nextStartAfterCursor).toBeUndefined();
		});
	});

	describe("edge cases", () => {
		test("should handle service throwing error", async () => {
			const error = new Error("Service error");
			mockMappingsService.getMappings.mockRejectedValueOnce(error);

			const mockContext = createMockContext({
				validatedQuery: mockMappingsQuery,
				validatedParams: { network: "testnet" },
			});

			expect(getMappings(mockContext)).rejects.toThrow("Service error");
		});

		test("should handle null/undefined response from service", async () => {
			mockMappingsService.getMappings.mockResolvedValueOnce(null as any);

			const mockContext = createMockContext({
				validatedQuery: mockMappingsQuery,
				validatedParams: { network: "testnet" },
			});

			expect(getMappings(mockContext)).rejects.toThrow();
		});

		test("should work with minimal query parameters", async () => {
			const minimalQuery = { limit: 5 };
			const mockContext = createMockContext({
				validatedQuery: minimalQuery,
				validatedParams: { network: "testnet" },
			});

			await getMappings(mockContext);

			expect(mockMappingsService.getMappings).toHaveBeenCalledWith({
				network: "testnet",
				originTokenAddress: undefined,
				wrappedTokenAddress: undefined,
				originNetworkIds: undefined,
				wrappedNetworkIds: undefined,
				limit: 5,
				startAfter: undefined,
			});
		});

		test("should handle different network values", async () => {
			const networks = ["mainnet", "testnet", "custom-network"];

			for (const network of networks) {
				const mockContext = createMockContext({
					validatedQuery: {},
					validatedParams: { network },
				});

				await getMappings(mockContext);

				expect(mockMappingsService.getMappings).toHaveBeenCalledWith(
					expect.objectContaining({ network })
				);
			}
		});
	});
});
