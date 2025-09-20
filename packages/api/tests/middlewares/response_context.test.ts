import { describe, test, expect, beforeEach, mock } from "bun:test";
import { getResponseContext } from "../../src/middlewares/response_context";

describe("Response Context Middleware", () => {
	let mockContext: any;
	let mockStatusFunction: ReturnType<typeof mock>;
	let mockJsonFunction: ReturnType<typeof mock>;

	beforeEach(() => {
		mockStatusFunction = mock(() => {});
		mockJsonFunction = mock(() => ({ json: "response" }));

		mockContext = {
			status: mockStatusFunction,
			json: mockJsonFunction,
		};
	});

	describe("getResponseContext", () => {
		test("should return ResponseContext with status and json functions", () => {
			const responseContext = getResponseContext(mockContext);

			expect(responseContext).toHaveProperty("status");
			expect(responseContext).toHaveProperty("json");
			expect(typeof responseContext.status).toBe("function");
			expect(typeof responseContext.json).toBe("function");
		});

		test("should call Hono context status method when status is called", () => {
			const responseContext = getResponseContext(mockContext);
			const statusCode = 404;

			const result = responseContext.status(statusCode);

			expect(mockStatusFunction).toHaveBeenCalledWith(statusCode);
			expect(result).toBe(responseContext); // Should return itself for chaining
		});

		test("should call Hono context json method when json is called", () => {
			const responseContext = getResponseContext(mockContext);
			const body = { message: "test", data: [1, 2, 3] };

			const result = responseContext.json(body);

			expect(mockJsonFunction).toHaveBeenCalledWith(body);
			expect(result).toEqual({ json: "response" });
		});

		test("should handle different status codes", () => {
			const responseContext = getResponseContext(mockContext);
			const statusCodes = [200, 201, 400, 401, 404, 500, 502];

			for (const statusCode of statusCodes) {
				responseContext.status(statusCode);
				expect(mockStatusFunction).toHaveBeenCalledWith(statusCode);
			}

			expect(mockStatusFunction).toHaveBeenCalledTimes(
				statusCodes.length
			);
		});

		test("should handle different body types for json", () => {
			const responseContext = getResponseContext(mockContext);
			const testBodies = [
				{ message: "success" },
				{ error: "not found", code: 404 },
				[1, 2, 3, 4, 5],
				"simple string",
				42,
				true,
				null,
				{ nested: { deep: { object: "value" } } },
			];

			for (const body of testBodies) {
				responseContext.json(body);
				expect(mockJsonFunction).toHaveBeenCalledWith(body);
			}

			expect(mockJsonFunction).toHaveBeenCalledTimes(testBodies.length);
		});

		test("should support method chaining for status", () => {
			const responseContext = getResponseContext(mockContext);

			const chainResult = responseContext.status(200).status(404);

			expect(mockStatusFunction).toHaveBeenCalledWith(200);
			expect(mockStatusFunction).toHaveBeenCalledWith(404);
			expect(chainResult).toBe(responseContext);
		});

		test("should work with empty context methods", () => {
			const emptyMockContext = {
				status: mock(() => {}),
				json: mock(() => ({})),
			};

			const responseContext = getResponseContext(emptyMockContext as any);

			expect(() => {
				responseContext.status(200);
				responseContext.json({ test: "data" });
			}).not.toThrow();
		});

		test("should preserve context reference", () => {
			const responseContext1 = getResponseContext(mockContext);
			const responseContext2 = getResponseContext(mockContext);

			// Both should call the same underlying context methods
			responseContext1.status(200);
			responseContext2.status(404);

			expect(mockStatusFunction).toHaveBeenCalledTimes(2);
			expect(mockStatusFunction).toHaveBeenCalledWith(200);
			expect(mockStatusFunction).toHaveBeenCalledWith(404);
		});

		test("should handle context with additional properties", () => {
			const extendedMockContext = {
				...mockContext,
				req: { method: "GET", url: "/test" },
				res: { headers: {} },
				additionalProperty: "value",
			};

			const responseContext = getResponseContext(extendedMockContext);

			// Should still work with extended context
			responseContext.status(200);
			responseContext.json({ result: "success" });

			expect(mockStatusFunction).toHaveBeenCalledWith(200);
			expect(mockJsonFunction).toHaveBeenCalledWith({
				result: "success",
			});
		});
	});

	describe("edge cases", () => {
		test("should handle undefined/null context gracefully", () => {
			const nullContext = null;

			expect(() => {
				getResponseContext(nullContext as any);
			}).toThrow(); // Will throw when trying to access properties of null
		});

		test("should handle context with missing methods", () => {
			const incompleteContext = {
				status: mockStatusFunction,
				// missing json method
			};

			const responseContext = getResponseContext(
				incompleteContext as any
			);

			// Status should work
			responseContext.status(200);
			expect(mockStatusFunction).toHaveBeenCalledWith(200);

			// JSON will throw when undefined is called as function
			expect(() => {
				responseContext.json({ test: "data" });
			}).toThrow();
		});

		test("should handle context methods that throw errors", () => {
			const errorContext = {
				status: mock(() => {
					throw new Error("Status error");
				}),
				json: mock(() => {
					throw new Error("JSON error");
				}),
			};

			const responseContext = getResponseContext(errorContext as any);

			expect(() => {
				responseContext.status(200);
			}).toThrow("Status error");

			expect(() => {
				responseContext.json({ test: "data" });
			}).toThrow("JSON error");
		});

		test("should handle zero and negative status codes", () => {
			const responseContext = getResponseContext(mockContext);

			responseContext.status(0);
			responseContext.status(-1);

			expect(mockStatusFunction).toHaveBeenCalledWith(0);
			expect(mockStatusFunction).toHaveBeenCalledWith(-1);
		});

		test("should handle large status codes", () => {
			const responseContext = getResponseContext(mockContext);
			const largeStatusCode = 999999;

			responseContext.status(largeStatusCode);

			expect(mockStatusFunction).toHaveBeenCalledWith(largeStatusCode);
		});
	});

	describe("integration scenarios", () => {
		test("should work in typical API response scenario", () => {
			const responseContext = getResponseContext(mockContext);

			// Typical success response flow
			responseContext.status(200);
			responseContext.json({
				success: true,
				data: { id: 1, name: "Test" },
				meta: { total: 1 },
			});

			expect(mockStatusFunction).toHaveBeenCalledWith(200);
			expect(mockJsonFunction).toHaveBeenCalledWith({
				success: true,
				data: { id: 1, name: "Test" },
				meta: { total: 1 },
			});
		});

		test("should work in error response scenario", () => {
			const responseContext = getResponseContext(mockContext);

			// Typical error response flow
			responseContext.status(400);
			responseContext.json({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid input parameters",
				},
			});

			expect(mockStatusFunction).toHaveBeenCalledWith(400);
			expect(mockJsonFunction).toHaveBeenCalledWith({
				success: false,
				error: {
					code: "VALIDATION_ERROR",
					message: "Invalid input parameters",
				},
			});
		});

		test("should support method chaining with different operations", () => {
			const responseContext = getResponseContext(mockContext);

			// Chain status and then call json
			const chainedResult = responseContext.status(201);
			chainedResult.json({ created: true });

			expect(mockStatusFunction).toHaveBeenCalledWith(201);
			expect(mockJsonFunction).toHaveBeenCalledWith({ created: true });
		});
	});
});
