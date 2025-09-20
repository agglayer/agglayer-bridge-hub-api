import { describe, test, expect, beforeEach, mock } from "bun:test";
import { getTokenMetadata } from "../../src/controllers/token_metadata";
import { createMockContext, mockTokenMetadata } from "../test-utils";

// Mock the services and servercore functions
const mockTokenMetadataService = {
	getTokenMetadata: mock(() => Promise.resolve(mockTokenMetadata)),
};

const mockHandleResponse = mock((context: any, data: any) => ({
	success: true,
	data,
	context,
}));

const mockGetResponseContext = mock(() => ({
	requestId: "test-request-id",
}));

// Mock the imports
mock.module("../../src/services/token_metadata", () => ({
	TokenMetadataService: mockTokenMetadataService,
}));

mock.module("@polygonlabs/servercore", () => ({
	handleResponse: mockHandleResponse,
}));

mock.module("../../src/middlewares/response_context", () => ({
	getResponseContext: mockGetResponseContext,
}));

describe("Token Metadata Controller", () => {
	beforeEach(() => {
		mockTokenMetadataService.getTokenMetadata.mockClear();
		mockHandleResponse.mockClear();
		mockGetResponseContext.mockClear();
	});

	describe("getTokenMetadata", () => {
		test("should call TokenMetadataService.getTokenMetadata with correct parameters", async () => {
			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
					network: "testnet",
				},
			});

			await getTokenMetadata(mockContext);

			// Check that the service was called with correct parameters
			expect(
				mockTokenMetadataService.getTokenMetadata
			).toHaveBeenCalledTimes(1);
			expect(
				mockTokenMetadataService.getTokenMetadata
			).toHaveBeenCalledWith(
				"testnet",
				"0x1234567890abcdef1234567890abcdef12345678",
				expect.arrayContaining([
					expect.objectContaining({
						or: expect.arrayContaining([
							expect.objectContaining({
								field: "originTokenAddress",
								operator: "==",
								value: "0x1234567890abcdef1234567890abcdef12345678",
							}),
							expect.objectContaining({
								field: "wrappedTokenAddress",
								operator: "==",
								value: "0x1234567890abcdef1234567890abcdef12345678",
							}),
						]),
					}),
				])
			);
		});

		test("should handle undefined tokenAddress", async () => {
			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: undefined,
					network: "mainnet",
				},
			});

			await getTokenMetadata(mockContext);

			expect(
				mockTokenMetadataService.getTokenMetadata
			).toHaveBeenCalledWith("mainnet", undefined, []);
		});

		test("should call handleResponse with token metadata", async () => {
			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: "0xabcd1234",
					network: "testnet",
				},
			});

			await getTokenMetadata(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				mockTokenMetadata
			);
		});

		test("should work with different network values", async () => {
			const networks = ["mainnet", "testnet", "polygon", "arbitrum"];
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";

			for (const network of networks) {
				const mockContext = createMockContext({
					validatedParams: {
						tokenAddress,
						network,
					},
				});

				await getTokenMetadata(mockContext);

				expect(
					mockTokenMetadataService.getTokenMetadata
				).toHaveBeenCalledWith(
					network,
					tokenAddress,
					expect.any(Array)
				);

				// Clear mock for next iteration
				mockTokenMetadataService.getTokenMetadata.mockClear();
			}
		});

		test("should work with different token addresses", async () => {
			const tokenAddresses = [
				"0x1234567890abcdef1234567890abcdef12345678",
				"0xA0b86a33E6b2B2d4A9Ea5b3b8A5aA4b0e4d5F6c7",
				"0xdAC17F958D2ee523a2206206994597C13D831ec7", // USDT
				"0x6B175474E89094C44Da98b954EedeAC495271d0F", // DAI
			];

			for (const tokenAddress of tokenAddresses) {
				const mockContext = createMockContext({
					validatedParams: {
						tokenAddress,
						network: "testnet",
					},
				});

				await getTokenMetadata(mockContext);

				const serviceCall =
					mockTokenMetadataService.getTokenMetadata.mock.calls[0];
				const [, , queryParams] = serviceCall as any;

				expect(queryParams[0].or[0].value).toBe(tokenAddress);
				expect(queryParams[0].or[1].value).toBe(tokenAddress);

				// Clear mock for next iteration
				mockTokenMetadataService.getTokenMetadata.mockClear();
			}
		});

		test("should handle null tokenAddress", async () => {
			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: null,
					network: "testnet",
				},
			});

			await getTokenMetadata(mockContext);

			const serviceCall =
				mockTokenMetadataService.getTokenMetadata.mock.calls[0];
			const [, tokenAddress, queryParams] = serviceCall as any;

			expect(tokenAddress).toBeNull();
			expect(queryParams).toEqual([]); // Should not add OR filter for null address
		});

		test("should handle empty string tokenAddress", async () => {
			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: "",
					network: "testnet",
				},
			});

			await getTokenMetadata(mockContext);

			const serviceCall =
				mockTokenMetadataService.getTokenMetadata.mock.calls[0];
			const [, tokenAddress, queryParams] = serviceCall as any;

			expect(tokenAddress).toBe("");
			expect(queryParams).toEqual([]); // Should not add OR filter for empty string
		});

		test("should pass through custom token metadata", async () => {
			const customMetadata = {
				name: "Custom Token",
				symbol: "CUSTOM",
				decimals: 6,
				originTokenAddress: "0xcustom123",
				originTokenNetwork: 42,
				wrappedTokenAddress: "0xcustomwrapped456",
				wrappedTokenNetwork: 137,
			};

			mockTokenMetadataService.getTokenMetadata.mockResolvedValueOnce(
				customMetadata
			);

			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: "0xcustom123",
					network: "testnet",
				},
			});

			await getTokenMetadata(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				customMetadata
			);
		});
	});

	describe("query parameter building", () => {
		test("should build OR query correctly with valid tokenAddress", async () => {
			const tokenAddress = "0x1234567890abcdef1234567890abcdef12345678";
			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress,
					network: "testnet",
				},
			});

			await getTokenMetadata(mockContext);

			const serviceCall =
				mockTokenMetadataService.getTokenMetadata.mock.calls[0];
			const [, , queryParams] = serviceCall as any;

			expect(queryParams).toHaveLength(1);
			expect(queryParams[0]).toEqual({
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

		test("should have empty query params when tokenAddress is falsy", async () => {
			const falsyValues = [null, undefined, "", false, 0];

			for (const tokenAddress of falsyValues) {
				const mockContext = createMockContext({
					validatedParams: {
						tokenAddress,
						network: "testnet",
					},
				});

				await getTokenMetadata(mockContext);

				const serviceCall =
					mockTokenMetadataService.getTokenMetadata.mock.calls[0];
				const [, , queryParams] = serviceCall as any;

				expect(queryParams).toEqual([]);

				// Clear mock for next iteration
				mockTokenMetadataService.getTokenMetadata.mockClear();
			}
		});
	});

	describe("edge cases", () => {
		test("should handle service throwing error", async () => {
			const error = new Error("Token not found");
			mockTokenMetadataService.getTokenMetadata.mockRejectedValueOnce(
				error
			);

			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
					network: "testnet",
				},
			});

			expect(getTokenMetadata(mockContext)).rejects.toThrow(
				"Token not found"
			);
		});

		test("should handle service returning null", async () => {
			mockTokenMetadataService.getTokenMetadata.mockResolvedValueOnce(
				null as any
			);

			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
					network: "testnet",
				},
			});

			await getTokenMetadata(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				null
			);
		});

		test("should handle service returning undefined", async () => {
			mockTokenMetadataService.getTokenMetadata.mockResolvedValueOnce(
				undefined as any
			);

			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
					network: "testnet",
				},
			});

			await getTokenMetadata(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				undefined
			);
		});

		test("should maintain response context correctly", async () => {
			const customResponseContext = {
				requestId: "custom-id",
				correlationId: "custom-correlation",
				timestamp: Date.now(),
			};
			mockGetResponseContext.mockReturnValueOnce(customResponseContext);

			const mockContext = createMockContext({
				validatedParams: {
					tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
					network: "testnet",
				},
			});

			await getTokenMetadata(mockContext);

			expect(mockGetResponseContext).toHaveBeenCalledWith(mockContext);
			expect(mockHandleResponse).toHaveBeenCalledWith(
				customResponseContext,
				mockTokenMetadata
			);
		});
	});
});
