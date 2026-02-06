import { describe, test, expect, beforeEach, mock } from "bun:test";
import { ProofController } from "../../src/controllers/proof";
import { createMockContext, mockProof, mockProofQuery } from "../test-utils";

// Mock the services and servercore functions
const mockProofService = {
	getProof: mock(() => Promise.resolve(mockProof)),
};

const mockTransactionService = {} as any;

const mockHandleResponse = mock((context: any, data: any) => ({
	success: true,
	data,
	context,
}));

const mockHandleError = mock((context: any, error: any) => ({
	success: false,
	error,
	context,
}));

const mockGetResponseContext = mock(() => ({
	requestId: "test-request-id",
}));

// Mock error classes
class MockApiError extends Error {
	constructor(
		message: string,
		public statusCode: number = 400
	) {
		super(message);
		this.name = "ApiError";
	}
}

class MockExternalDependencyError extends Error {
	constructor(
		message: string,
		public statusCode: number = 502
	) {
		super(message);
		this.name = "ExternalDependencyError";
	}
}

// Mock the imports
mock.module("../../src/services/proof", () => ({
	ProofService: mockProofService,
}));

mock.module("@polygonlabs/servercore", () => ({
	handleResponse: mockHandleResponse,
	handleError: mockHandleError,
	ApiError: MockApiError,
	ExternalDependencyError: MockExternalDependencyError,
}));

mock.module("../../src/middlewares/response_context", () => ({
	getResponseContext: mockGetResponseContext,
}));

describe("Proof Controller", () => {
	let proofController: ProofController;

	beforeEach(() => {
		mockProofService.getProof.mockClear();
		mockHandleResponse.mockClear();
		mockHandleError.mockClear();
		mockGetResponseContext.mockClear();
		proofController = new ProofController(
			mockProofService as any,
			mockTransactionService
		);
	});

	describe("getProof", () => {
		test("should call ProofService.getProof with correct parameters", async () => {
			const mockContext = createMockContext({
				validatedQuery: mockProofQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockProofService.getProof).toHaveBeenCalledWith(
				"testnet",
				mockProofQuery.sourceNetworkId,
				mockProofQuery.depositCount,
				mockProofQuery.leafIndex
			);
		});

		test("should call handleResponse with proof data on success", async () => {
			const mockContext = createMockContext({
				validatedQuery: mockProofQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				mockProof
			);
			expect(mockHandleError).not.toHaveBeenCalled();
		});

		test("should handle different network values", async () => {
			const networks = [
				"mainnet",
				"testnet",
				"polygon",
				"custom-network",
			];

			for (const network of networks) {
				const mockContext = createMockContext({
					validatedQuery: mockProofQuery,
					validatedParams: { network },
				});

				await proofController.getProof(mockContext);

				expect(mockProofService.getProof).toHaveBeenCalledWith(
					network,
					mockProofQuery.sourceNetworkId,
					mockProofQuery.depositCount,
					mockProofQuery.leafIndex
				);

				// Clear mock for next iteration
				mockProofService.getProof.mockClear();
			}
		});

		test("should handle different query parameter values", async () => {
			const testCases = [
				{ sourceNetworkId: 1, depositCount: 0, leafIndex: 0 },
				{
					sourceNetworkId: 137,
					depositCount: 999999,
					leafIndex: 500000,
				},
				{ sourceNetworkId: 42, depositCount: 12345, leafIndex: 67890 },
			];

			for (const query of testCases) {
				const mockContext = createMockContext({
					validatedQuery: query,
					validatedParams: { network: "testnet" },
				});

				await proofController.getProof(mockContext);

				expect(mockProofService.getProof).toHaveBeenCalledWith(
					"testnet",
					query.sourceNetworkId,
					query.depositCount,
					query.leafIndex
				);

				// Clear mock for next iteration
				mockProofService.getProof.mockClear();
			}
		});

		test("should pass through proof data unchanged", async () => {
			const customProof = {
				proof_local_exit_root: ["0xcustom1", "0xcustom2"],
				proof_rollup_exit_root: ["0xrollup1"],
				l1_info_tree_leaf: {
					block_num: 12345,
					block_pos: 1,
					l1_info_tree_index: 42,
					previous_block_hash: "0xcustomprevious",
					timestamp: 1700000000,
					mainnet_exit_root: "0xmainroot",
					rollup_exit_root: "0xrolluproot",
					global_exit_root: "0xcustomglobal",
					hash: "0xcustomhash",
				},
				bridge_tx_metadata: "0xcustommetadata",
			};

			mockProofService.getProof.mockResolvedValueOnce(customProof);

			const mockContext = createMockContext({
				validatedQuery: mockProofQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				customProof
			);
		});
	});

	describe("error handling", () => {
		test("should handle ApiError", async () => {
			const apiError = new MockApiError("Invalid proof request", 400);
			mockProofService.getProof.mockRejectedValueOnce(apiError);

			const mockContext = createMockContext({
				validatedQuery: mockProofQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockHandleError).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				apiError
			);
			expect(mockHandleResponse).not.toHaveBeenCalled();
		});

		test("should handle ExternalDependencyError", async () => {
			const externalError = new MockExternalDependencyError(
				"Service unavailable",
				502
			);
			mockProofService.getProof.mockRejectedValueOnce(externalError);

			const mockContext = createMockContext({
				validatedQuery: mockProofQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockHandleError).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				externalError
			);
			expect(mockHandleResponse).not.toHaveBeenCalled();
		});

		test("should handle generic Error as ApiError", async () => {
			const genericError = new Error("Generic error");
			mockProofService.getProof.mockRejectedValueOnce(genericError);

			const mockContext = createMockContext({
				validatedQuery: mockProofQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockHandleError).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				genericError
			);
			expect(mockHandleResponse).not.toHaveBeenCalled();
		});

		test("should handle null/undefined errors", async () => {
			mockProofService.getProof.mockRejectedValueOnce(null);

			const mockContext = createMockContext({
				validatedQuery: mockProofQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockHandleError).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				null
			);
		});
	});

	describe("edge cases", () => {
		test("should handle zero values in query", async () => {
			const zeroQuery = {
				sourceNetworkId: 0,
				depositCount: 0,
				leafIndex: 0,
			};

			const mockContext = createMockContext({
				validatedQuery: zeroQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockProofService.getProof).toHaveBeenCalledWith(
				"testnet",
				0,
				0,
				0
			);
		});

		test("should handle large numeric values", async () => {
			const largeQuery = {
				sourceNetworkId: 999999999,
				depositCount: Number.MAX_SAFE_INTEGER,
				leafIndex: Number.MAX_SAFE_INTEGER - 1,
			};

			const mockContext = createMockContext({
				validatedQuery: largeQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockProofService.getProof).toHaveBeenCalledWith(
				"testnet",
				largeQuery.sourceNetworkId,
				largeQuery.depositCount,
				largeQuery.leafIndex
			);
		});

		test("should maintain response context through error flow", async () => {
			const error = new MockApiError("Test error");
			mockProofService.getProof.mockRejectedValueOnce(error);

			const customResponseContext = {
				requestId: "custom-id",
				correlationId: "custom-correlation",
			};
			mockGetResponseContext.mockReturnValueOnce(customResponseContext);

			const mockContext = createMockContext({
				validatedQuery: mockProofQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockGetResponseContext).toHaveBeenCalledWith(mockContext);
			expect(mockHandleError).toHaveBeenCalledWith(
				customResponseContext,
				error
			);
		});

		test("should maintain response context through success flow", async () => {
			const customResponseContext = { requestId: "custom-success-id" };
			mockGetResponseContext.mockReturnValueOnce(customResponseContext);

			const mockContext = createMockContext({
				validatedQuery: mockProofQuery,
				validatedParams: { network: "testnet" },
			});

			await proofController.getProof(mockContext);

			expect(mockGetResponseContext).toHaveBeenCalledWith(mockContext);
			expect(mockHandleResponse).toHaveBeenCalledWith(
				customResponseContext,
				mockProof
			);
		});
	});
});
