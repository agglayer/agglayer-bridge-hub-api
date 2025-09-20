import { describe, test, expect, beforeEach, mock } from "bun:test";
import { checkServiceHealth } from "../../src/controllers/health_check";
import { createMockContext } from "../test-utils";

// Mock servercore functions
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

// Mock the imports
mock.module("@polygonlabs/servercore", () => ({
	handleResponse: mockHandleResponse,
	handleError: mockHandleError,
	ApiError: class ApiError extends Error {
		constructor(message: string) {
			super(message);
			this.name = "ApiError";
		}
	},
}));

mock.module("../../src/middlewares/response_context", () => ({
	getResponseContext: mockGetResponseContext,
}));

describe("Health Check Controller", () => {
	beforeEach(() => {
		mockHandleResponse.mockClear();
		mockHandleError.mockClear();
		mockGetResponseContext.mockClear();
	});

	describe("checkServiceHealth", () => {
		test("should return success response", async () => {
			const mockContext = createMockContext();

			await checkServiceHealth(mockContext);

			expect(mockGetResponseContext).toHaveBeenCalledWith(mockContext);
			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				{
					status: "success",
					message: "All services are working correctly",
				}
			);
		});

		test("should not call handleError for successful health check", async () => {
			const mockContext = createMockContext();

			await checkServiceHealth(mockContext);

			expect(mockHandleError).not.toHaveBeenCalled();
		});

		test("should return consistent response structure", async () => {
			const mockContext = createMockContext();

			await checkServiceHealth(mockContext);

			const responseCall = mockHandleResponse.mock.calls[0];
			const [context, data] = responseCall;

			expect(context).toEqual({ requestId: "test-request-id" });
			expect(data).toEqual({
				status: "success",
				message: "All services are working correctly",
			});
		});

		test("should handle multiple calls consistently", async () => {
			const mockContext1 = createMockContext();
			const mockContext2 = createMockContext();

			await checkServiceHealth(mockContext1);
			await checkServiceHealth(mockContext2);

			expect(mockHandleResponse).toHaveBeenCalledTimes(2);
			expect(mockGetResponseContext).toHaveBeenCalledTimes(2);

			// Both calls should have the same response data structure
			const firstCall = mockHandleResponse.mock.calls[0];
			const secondCall = mockHandleResponse.mock.calls[1];

			expect(firstCall[1]).toEqual(secondCall[1]);
		});
	});

	describe("edge cases", () => {
		test("should handle context parameter correctly", async () => {
			const customContext = createMockContext({
				validatedQuery: { test: "value" },
				validatedParams: { network: "testnet" },
			});

			await checkServiceHealth(customContext);

			expect(mockGetResponseContext).toHaveBeenCalledWith(customContext);
		});

		test("should work with empty context", async () => {
			const emptyContext = createMockContext({});

			await checkServiceHealth(emptyContext);

			expect(mockHandleResponse).toHaveBeenCalledWith(
				{ requestId: "test-request-id" },
				{
					status: "success",
					message: "All services are working correctly",
				}
			);
		});
	});

	describe("response structure", () => {
		test("should have correct status and message properties", async () => {
			const mockContext = createMockContext();

			await checkServiceHealth(mockContext);

			const responseCall = mockHandleResponse.mock.calls[0];
			const data = responseCall[1];

			expect(data).toHaveProperty("status", "success");
			expect(data).toHaveProperty(
				"message",
				"All services are working correctly"
			);
		});

		test("should have exactly two properties in response data", async () => {
			const mockContext = createMockContext();

			await checkServiceHealth(mockContext);

			const responseCall = mockHandleResponse.mock.calls[0];
			const data = responseCall[1];
			const keys = Object.keys(data);

			expect(keys).toHaveLength(2);
			expect(keys).toContain("status");
			expect(keys).toContain("message");
		});
	});
});
