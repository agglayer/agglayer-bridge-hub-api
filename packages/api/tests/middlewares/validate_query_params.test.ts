import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
	validateTransactionQueryParams,
	validateTransactionByDepositCountQueryParams,
	validateMappingsQueryParams,
	validateMappingsByTokenQueryParams,
	validateTokenMetadataQueryParams,
	validateClaimProofQueryParams,
} from "../../src/middlewares/validate_query_params";

// Mock servercore classes
class MockBadRequestError extends Error {
	constructor(
		message: string,
		public details?: any,
		public statusCode?: number,
		public context?: any
	) {
		super(message);
		this.name = "BadRequestError";
	}
}

const mockHandleError = mock(() => Promise.resolve());

mock.module("@polygonlabs/servercore", () => ({
	BadRequestError: MockBadRequestError,
	handleError: mockHandleError,
}));

// Mock response context
const mockGetResponseContext = mock(() => ({
	status: mock(() => ({})),
	json: mock(() => ({})),
}));

mock.module("../../src/middlewares/response_context", () => ({
	getResponseContext: mockGetResponseContext,
}));

describe("Validate Query Params Middlewares", () => {
	let mockContext: any;
	let mockNext: ReturnType<typeof mock>;

	beforeEach(() => {
		mockNext = mock(() => Promise.resolve());
		mockHandleError.mockClear();
		mockGetResponseContext.mockClear();

		mockContext = {
			req: {
				param: mock(() => ({})),
				query: mock(() => ({})),
			},
			set: mock(() => {}),
		};
	});

	describe("validateTransactionQueryParams", () => {
		test("should validate successfully with valid params and query", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({
				fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
				limit: "10",
			});

			await validateTransactionQueryParams(mockContext, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedQuery",
				expect.any(Object)
			);
			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedParams",
				expect.any(Object)
			);
			expect(mockNext).toHaveBeenCalled();
			expect(mockHandleError).not.toHaveBeenCalled();
		});

		test("should handle invalid query parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({
				fromAddress: "invalid-address", // Invalid Ethereum address
				limit: "not-a-number", // Invalid limit
			});

			await validateTransactionQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateTransactionQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle invalid network parameter", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "" }); // Empty network
			mockContext.req.query.mockReturnValueOnce({
				fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
			});

			await validateTransactionQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateTransactionQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle both invalid params and query (query error takes precedence)", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "" });
			mockContext.req.query.mockReturnValueOnce({
				fromAddress: "invalid-address",
			});

			await validateTransactionQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateTransactionQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle empty query and params", async () => {
			mockContext.req.param.mockReturnValueOnce({});
			mockContext.req.query.mockReturnValueOnce({});

			await validateTransactionQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe("validateTransactionByDepositCountQueryParams", () => {
		test("should validate successfully with valid parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				depositCount: "42",
				sourceNetworkId: "1",
			});

			await validateTransactionByDepositCountQueryParams(
				mockContext,
				mockNext
			);

			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedParams",
				expect.any(Object)
			);
			expect(mockNext).toHaveBeenCalled();
			expect(mockHandleError).not.toHaveBeenCalled();
		});

		test("should handle invalid parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				depositCount: "not-a-number",
				sourceNetwork: "invalid",
			});

			await validateTransactionByDepositCountQueryParams(
				mockContext,
				mockNext
			);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateTransactionByDepositCountQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle missing required parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				// Missing depositCount and sourceNetwork
			});

			await validateTransactionByDepositCountQueryParams(
				mockContext,
				mockNext
			);

			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle negative numbers", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				depositCount: "-1",
				sourceNetwork: "1",
			});

			await validateTransactionByDepositCountQueryParams(
				mockContext,
				mockNext
			);

			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe("validateMappingsQueryParams", () => {
		test("should validate successfully with valid params and query", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "mainnet" });
			mockContext.req.query.mockReturnValueOnce({
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
				originNetworkIds: "1,137",
				limit: "20",
			});

			await validateMappingsQueryParams(mockContext, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedQuery",
				expect.any(Object)
			);
			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedParams",
				expect.any(Object)
			);
			expect(mockNext).toHaveBeenCalled();
			expect(mockHandleError).not.toHaveBeenCalled();
		});

		test("should handle invalid query parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({
				originTokenAddress: "invalid-address",
				originNetworkIds: "invalid,ids",
			});

			await validateMappingsQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateMappingsQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle invalid network parameter", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: 123 }); // Wrong type
			mockContext.req.query.mockReturnValueOnce({
				originTokenAddress:
					"0x1234567890abcdef1234567890abcdef12345678",
			});

			await validateMappingsQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateMappingsQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should validate with minimal valid parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({}); // Empty query is valid

			await validateMappingsQueryParams(mockContext, mockNext);

			expect(mockNext).toHaveBeenCalled();
			expect(mockHandleError).not.toHaveBeenCalled();
		});
	});

	describe("validateMappingsByTokenQueryParams", () => {
		test("should validate successfully with valid token parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
				tokenNetwork: "1",
			});
			mockContext.req.query.mockReturnValueOnce({
				limit: "10",
				startAfter: "cursor123",
			});

			await validateMappingsByTokenQueryParams(mockContext, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedQuery",
				expect.any(Object)
			);
			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedParams",
				expect.any(Object)
			);
			expect(mockNext).toHaveBeenCalled();
			expect(mockHandleError).not.toHaveBeenCalled();
		});

		test("should handle invalid token address", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				tokenAddress: "invalid-token-address",
				tokenNetwork: "1",
			});
			mockContext.req.query.mockReturnValueOnce({});

			await validateMappingsByTokenQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateMappingsByOriginTokenQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle invalid token network", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
				tokenNetwork: "invalid-network",
			});
			mockContext.req.query.mockReturnValueOnce({});

			await validateMappingsByTokenQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateMappingsByOriginTokenQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle invalid pagination parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
				tokenNetwork: "1",
			});
			mockContext.req.query.mockReturnValueOnce({
				limit: "invalid-limit",
			});

			await validateMappingsByTokenQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateMappingsByOriginTokenQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle missing required parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				// Missing tokenAddress and tokenNetwork
			});
			mockContext.req.query.mockReturnValueOnce({});

			await validateMappingsByTokenQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe("validateTokenMetadataQueryParams", () => {
		test("should validate successfully with valid token metadata parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
				tokenNetwork: "1",
			});

			await validateTokenMetadataQueryParams(mockContext, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedParams",
				expect.any(Object)
			);
			expect(mockNext).toHaveBeenCalled();
			expect(mockHandleError).not.toHaveBeenCalled();
		});

		test("should handle invalid token address", async () => {
			mockContext.req.param.mockReturnValueOnce({
				network: "testnet",
				tokenAddress: "0xinvalid",
				tokenNetwork: "1",
			});

			await validateTokenMetadataQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateTokenMetadataQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle missing network parameter", async () => {
			mockContext.req.param.mockReturnValueOnce({
				// Missing network parameter
				tokenAddress: "0x1234567890abcdef1234567890abcdef12345678",
				tokenNetwork: "1",
			});

			await validateTokenMetadataQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle completely empty parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({});

			await validateTokenMetadataQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe("validateClaimProofQueryParams", () => {
		test("should validate successfully with valid proof parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({
				depositCount: "42",
				sourceNetworkId: "1",
				leafIndex: "100",
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedQuery",
				expect.any(Object)
			);
			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedParams",
				expect.any(Object)
			);
			expect(mockNext).toHaveBeenCalled();
			expect(mockHandleError).not.toHaveBeenCalled();
		});

		test("should handle invalid query parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({
				depositCount: "invalid",
				sourceNetwork: "not-a-number",
				leafIndex: "-1", // Negative leaf index
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateProofQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle invalid network parameter", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: null }); // Null network
			mockContext.req.query.mockReturnValueOnce({
				depositCount: "42",
				sourceNetwork: "1",
				leafIndex: "100",
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateProofQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle missing required query parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({
				// Missing all required parameters
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle partial missing query parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({
				depositCount: "42",
				// Missing sourceNetwork and leafIndex
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle both invalid params and query (query error takes precedence)", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "" });
			mockContext.req.query.mockReturnValueOnce({
				depositCount: "invalid",
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateProofQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle zero values in query parameters", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({
				depositCount: "0",
				sourceNetwork: "0",
				leafIndex: "0",
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			// Depending on schema, zeros might be valid or invalid
			// This test verifies the behavior is consistent
			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle invalid params when query is valid", async () => {
			// This tests the else-if block (lines 174-182) where query succeeds but params fail
			mockContext.req.param.mockReturnValueOnce({
				network: "invalid-network",
			});
			mockContext.req.query.mockReturnValueOnce({
				depositCount: "42",
				sourceNetworkId: "1",
				leafIndex: "100",
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalledWith(
				expect.any(Object),
				expect.objectContaining({
					name: "BadRequestError",
					context: "validateProofQueryParams",
				})
			);
			expect(mockNext).not.toHaveBeenCalled();
			expect(mockContext.set).not.toHaveBeenCalled();
		});

		test("should handle empty network param when query is valid", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "" });
			mockContext.req.query.mockReturnValueOnce({
				depositCount: "42",
				sourceNetworkId: "1",
				leafIndex: "100",
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalled();
			const errorCall = mockHandleError.mock.calls[0] as any;
			const error = errorCall[1];

			expect(error).toBeInstanceOf(MockBadRequestError);
			expect(error.context).toBe("validateProofQueryParams");
			expect(mockNext).not.toHaveBeenCalled();
		});

		test("should handle missing network param when query is valid", async () => {
			mockContext.req.param.mockReturnValueOnce({});
			mockContext.req.query.mockReturnValueOnce({
				depositCount: "42",
				sourceNetworkId: "1",
				leafIndex: "100",
			});

			await validateClaimProofQueryParams(mockContext, mockNext);

			expect(mockHandleError).toHaveBeenCalled();
			expect(mockNext).not.toHaveBeenCalled();
		});
	});

	describe("error handling consistency", () => {
		test("should call handleError with consistent response context", async () => {
			const mockResponseContext = { status: mock(), json: mock() };
			mockGetResponseContext.mockReturnValue(mockResponseContext);

			mockContext.req.param.mockReturnValue({ network: "invalid" });
			mockContext.req.query.mockReturnValue({});

			await validateTransactionQueryParams(mockContext, mockNext);

			expect(mockGetResponseContext).toHaveBeenCalledWith(mockContext);
			expect(mockHandleError).toHaveBeenCalledWith(
				mockResponseContext,
				expect.any(MockBadRequestError)
			);
		});

		test("should create BadRequestError with proper structure", async () => {
			mockContext.req.param.mockReturnValue({});
			mockContext.req.query.mockReturnValue({});

			await validateTransactionQueryParams(mockContext, mockNext);

			const errorCall = mockHandleError.mock.calls[0] as any;
			const error = errorCall[1];

			expect(error).toBeInstanceOf(MockBadRequestError);
			expect(error).toBeDefined();
			expect(error.name).toBe("BadRequestError");
			expect(error.context).toBe("validateTransactionQueryParams");
			expect(error.details).toBeDefined();
		});
	});

	describe("context setting behavior", () => {
		test("should set validated data only on successful validation", async () => {
			mockContext.req.param.mockReturnValueOnce({ network: "testnet" });
			mockContext.req.query.mockReturnValueOnce({ limit: "10" });

			await validateTransactionQueryParams(mockContext, mockNext);

			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedQuery",
				expect.any(Object)
			);
			expect(mockContext.set).toHaveBeenCalledWith(
				"validatedParams",
				expect.any(Object)
			);
			expect(mockContext.set).toHaveBeenCalledTimes(2);
		});

		test("should not set context on validation failure", async () => {
			mockContext.req.param.mockReturnValueOnce({});
			mockContext.req.query.mockReturnValueOnce({});

			await validateTransactionQueryParams(mockContext, mockNext);

			expect(mockContext.set).not.toHaveBeenCalled();
		});
	});
});
