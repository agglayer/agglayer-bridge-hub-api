import { describe, test, expect, beforeEach, mock } from "bun:test";
import {
	getTransactions,
	getTransactionByDepositCount,
} from "../../src/controllers/transactions";
import {
	createMockContext,
	mockTransactionsQuery,
	mockTransactionServiceResponse,
	mockTransaction,
} from "../test-utils";

// Mock the services and servercore functions
const mockTransactionService = {
	getTransactions: mock(() =>
		Promise.resolve(mockTransactionServiceResponse)
	),
	getTransactionByDepositCount: mock(() => Promise.resolve(mockTransaction)),
	generateDocId: mock(
		(depositCount: number, sourceNetworkId: number) =>
			`doc-${depositCount}-${sourceNetworkId}`
	),
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

// Mock the TransactionService module
mock.module("../../src/services/transactions", () => ({
	TransactionService: mockTransactionService,
}));

mock.module("@polygonlabs/servercore", () => ({
	handleResponse: mockHandleResponse,
}));

mock.module("../../src/middlewares/response_context", () => ({
	getResponseContext: mockGetResponseContext,
}));

describe("Transactions Controller", () => {
	beforeEach(() => {
		mockTransactionService.getTransactions.mockClear();
		mockTransactionService.getTransactionByDepositCount.mockClear();
		mockTransactionService.generateDocId.mockClear();
		mockHandleResponse.mockClear();
		mockGetResponseContext.mockClear();
	});

	describe("getTransactions", () => {
		test("should build query params correctly with all filters", async () => {
			const fullQuery = {
				fromAddress: "0xfrom123",
				sourceNetworkIds: [1, 2],
				destinationNetworkIds: [137, 42],
				updatedSince: 1700000000,
				status: "BRIDGED",
				order: "desc" as const,
				limit: 20,
				startAfter: "hub-uid-123",
			};

			const mockContext = createMockContext({
				validatedQuery: fullQuery,
				validatedParams: { network: "testnet" },
			});

			await getTransactions(mockContext);

			// Check that the service was called with correct parameters
			const serviceCall =
				mockTransactionService.getTransactions.mock.calls[0];
			const [params] = serviceCall as any;

			expect(params.network).toBe("testnet");
			expect(params.fromAddress).toBe("0xfrom123");
			expect(params.sourceNetworkIds).toEqual([1, 2]);
			expect(params.destinationNetworkIds).toEqual([137, 42]);
			expect(params.updatedSince).toBe(1700000000);
			expect(params.status).toBe("BRIDGED");
			expect(params.order).toBe("desc");
			expect(params.limit).toBe(20);
			expect(params.startAfter).toBe("hub-uid-123");
		});

		test("should handle empty query parameters", async () => {
			const mockContext = createMockContext({
				validatedQuery: {},
				validatedParams: { network: "mainnet" },
			});

			await getTransactions(mockContext);

			const serviceCall =
				mockTransactionService.getTransactions.mock.calls[0];
			const [params] = serviceCall as any;

			expect(params.network).toBe("mainnet");
			expect(params.fromAddress).toBeUndefined();
			expect(params.sourceNetworkIds).toBeUndefined();
			expect(params.destinationNetworkIds).toBeUndefined();
			expect(params.updatedSince).toBeUndefined();
			expect(params.status).toBeUndefined();
			expect(params.order).toBeUndefined();
			expect(params.startAfter).toBeUndefined();
			expect(params.limit).toBeUndefined();
		});

		test("should handle updatedSince with default order", async () => {
			const queryWithUpdatedSince = {
				updatedSince: 1700000000,
			};

			const mockContext = createMockContext({
				validatedQuery: queryWithUpdatedSince,
				validatedParams: { network: "testnet" },
			});

			await getTransactions(mockContext);

			const serviceCall =
				mockTransactionService.getTransactions.mock.calls[0];
			const [params] = serviceCall as any;

			expect(params.updatedSince).toBe(1700000000);
			expect(params.order).toBeUndefined(); // No explicit order provided, will use default "asc" in service
		});

		test("should handle order without updatedSince", async () => {
			const queryWithOrder = {
				order: "desc" as const,
			};

			const mockContext = createMockContext({
				validatedQuery: queryWithOrder,
				validatedParams: { network: "testnet" },
			});

			await getTransactions(mockContext);

			const serviceCall =
				mockTransactionService.getTransactions.mock.calls[0];
			const [params] = serviceCall as any;

			expect(params.order).toBe("desc");
		});

		test("should call handleResponse with correct parameters", async () => {
			const mockContext = createMockContext({
				validatedQuery: mockTransactionsQuery,
				validatedParams: { network: "testnet" },
			});

			await getTransactions(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				mockTransactionServiceResponse.documents,
				{
					total: mockTransactionServiceResponse.totalDocumentsCount,
					limit: mockTransactionsQuery.limit,
					nextStartAfterCursor:
						mockTransactionServiceResponse.documents.at(-1)?.hubUID,
				}
			);
		});

		test("should handle service response without totalDocumentsCount", async () => {
			const responseWithoutCount = {
				documents: mockTransactionServiceResponse.documents,
			};
			mockTransactionService.getTransactions.mockResolvedValueOnce(
				responseWithoutCount as any
			);

			const mockContext = createMockContext({
				validatedQuery: mockTransactionsQuery,
				validatedParams: { network: "testnet" },
			});

			await getTransactions(mockContext);

			const handleResponseCall = mockHandleResponse.mock.calls[0];
			const metaParam = handleResponseCall[2];

			expect(metaParam.total).toBe(0);
		});

		test("should handle empty transactions response", async () => {
			const emptyResponse = { documents: [], totalDocumentsCount: 0 };
			mockTransactionService.getTransactions.mockResolvedValueOnce(
				emptyResponse
			);

			const mockContext = createMockContext({
				validatedQuery: mockTransactionsQuery,
				validatedParams: { network: "testnet" },
			});

			await getTransactions(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				emptyResponse.documents,
				{
					total: 0,
					limit: mockTransactionsQuery.limit,
					nextStartAfterCursor: undefined,
				}
			);
		});
	});

	describe("getTransactionByDepositCount", () => {
		test("should generate docId and call service with correct parameters", async () => {
			const mockContext = createMockContext({
				validatedParams: {
					sourceNetworkId: 1,
					depositCount: 42,
					network: "testnet",
				},
			});

			await getTransactionByDepositCount(mockContext);

			expect(mockTransactionService.generateDocId).toHaveBeenCalledWith(
				42,
				1
			);
			expect(
				mockTransactionService.getTransactionByDepositCount
			).toHaveBeenCalledWith("testnet", "doc-42-1");
		});

		test("should call handleResponse with transaction data", async () => {
			const mockContext = createMockContext({
				validatedParams: {
					sourceNetworkId: 2,
					depositCount: 100,
					network: "mainnet",
				},
			});

			await getTransactionByDepositCount(mockContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				mockTransaction
			);
		});

		test("should handle different sourceNetworkId and depositCount values", async () => {
			const testCases = [
				{ sourceNetworkId: 1, depositCount: 0 },
				{ sourceNetworkId: 137, depositCount: 999999 },
				{ sourceNetworkId: 42, depositCount: 12345 },
			];

			for (const { sourceNetworkId, depositCount } of testCases) {
				const mockContext = createMockContext({
					validatedParams: {
						sourceNetworkId,
						depositCount,
						network: "testnet",
					},
				});

				await getTransactionByDepositCount(mockContext);

				expect(
					mockTransactionService.generateDocId
				).toHaveBeenCalledWith(depositCount, sourceNetworkId);

				// Clear mocks for next iteration
				mockTransactionService.generateDocId.mockClear();
				mockTransactionService.getTransactionByDepositCount.mockClear();
			}
		});

		test("should work with different network values", async () => {
			const networks = ["mainnet", "testnet", "custom"];

			for (const network of networks) {
				const mockContext = createMockContext({
					validatedParams: {
						sourceNetworkId: 1,
						depositCount: 42,
						network,
					},
				});

				await getTransactionByDepositCount(mockContext);

				expect(
					mockTransactionService.getTransactionByDepositCount
				).toHaveBeenCalledWith(network, "doc-42-1");

				// Clear mocks for next iteration
				mockTransactionService.generateDocId.mockClear();
				mockTransactionService.getTransactionByDepositCount.mockClear();
			}
		});
	});

	describe("edge cases", () => {
		test("should handle service throwing error in getTransactions", async () => {
			const error = new Error("Service error");
			mockTransactionService.getTransactions.mockRejectedValueOnce(error);

			const mockContext = createMockContext({
				validatedQuery: mockTransactionsQuery,
				validatedParams: { network: "testnet" },
			});

			expect(getTransactions(mockContext)).rejects.toThrow(
				"Service error"
			);
		});

		test("should handle service throwing error in getTransactionByDepositCount", async () => {
			const error = new Error("Transaction not found");
			mockTransactionService.getTransactionByDepositCount.mockRejectedValueOnce(
				error
			);

			const mockContext = createMockContext({
				validatedParams: {
					sourceNetworkId: 1,
					depositCount: 42,
					network: "testnet",
				},
			});

			expect(getTransactionByDepositCount(mockContext)).rejects.toThrow(
				"Transaction not found"
			);
		});

		test("should handle complex query combinations", async () => {
			const complexQuery = {
				fromAddress: "0xcomplex",
				sourceNetworkIds: [1, 2, 3, 4, 5],
				destinationNetworkIds: [137, 42, 56, 80001],
				updatedSince: 1700000000,
				status: "CLAIMED",
				order: "asc" as const,
				limit: 100,
			};

			const mockContext = createMockContext({
				validatedQuery: complexQuery,
				validatedParams: { network: "testnet" },
			});

			await getTransactions(mockContext);

			const serviceCall =
				mockTransactionService.getTransactions.mock.calls[0];
			const [params] = serviceCall as any;

			// Should have all the complex query parameters
			expect(params.fromAddress).toBe("0xcomplex");
			expect(params.sourceNetworkIds).toEqual([1, 2, 3, 4, 5]);
			expect(params.destinationNetworkIds).toEqual([137, 42, 56, 80001]);
			expect(params.updatedSince).toBe(1700000000);
			expect(params.status).toBe("CLAIMED");
			expect(params.order).toBe("asc");
			expect(params.limit).toBe(100);
		});
	});
});
