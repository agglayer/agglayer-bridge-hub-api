import { describe, test, expect, vi } from 'vitest';

import { getResponseContext } from '../../src/middlewares/response_context.ts';

// Mock ApiError
const { ApiError } = vi.hoisted(() => {
	class ApiError extends Error {
		constructor(message: string) {
			super(message);
			this.name = 'ApiError';
		}
	}
	return { ApiError };
});

// Mock servercore
vi.mock('@polygonlabs/servercore', () => ({
	ApiError
}));

describe('response_context middleware', () => {
	describe('getResponseContext', () => {
		test('should create response context with status and json methods', () => {
			const mockJson = vi.fn(() => ({ data: 'test' }));
			const mockStatus = vi.fn(() => {});
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);

			expect(responseContext).toBeDefined();
			expect(responseContext.status).toBeDefined();
			expect(responseContext.json).toBeDefined();
			expect(typeof responseContext.status).toBe('function');
			expect(typeof responseContext.json).toBe('function');
		});

		test('should throw ApiError when context is null', () => {
			expect(() => getResponseContext(null as any)).toThrow('Context is required');
		});

		test('should throw ApiError when context is undefined', () => {
			expect(() => getResponseContext(undefined as any)).toThrow('Context is required');
		});

		test('should call Hono context status method with correct status code', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => ({ data: 'test' }));
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);
			responseContext.status(200);

			expect(mockStatus).toHaveBeenCalledWith(200);
		});

		test('should call Hono context json method with correct body', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => ({ data: 'test' }));
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);
			const testBody = { message: 'success', data: [1, 2, 3] };
			responseContext.json(testBody);

			expect(mockJson).toHaveBeenCalledWith(testBody);
		});

		test('should return responseContext from status method for chaining', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => ({ data: 'test' }));
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);
			const result = responseContext.status(200);

			expect(result).toBe(responseContext);
		});

		test('should allow chaining status and json methods', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => ({ data: 'test' }));
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);
			const testBody = { message: 'success' };

			responseContext.status(201).json(testBody);

			expect(mockStatus).toHaveBeenCalledWith(201);
			expect(mockJson).toHaveBeenCalledWith(testBody);
		});

		test('should work with different status codes', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => ({ data: 'test' }));
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);

			responseContext.status(404);
			expect(mockStatus).toHaveBeenCalledWith(404);

			responseContext.status(500);
			expect(mockStatus).toHaveBeenCalledWith(500);

			responseContext.status(201);
			expect(mockStatus).toHaveBeenCalledWith(201);
		});

		test('should work with complex JSON bodies', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => ({ data: 'test' }));
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);
			const complexBody = {
				data: [
					{ id: 1, name: 'test1', nested: { value: 100 } },
					{ id: 2, name: 'test2', nested: { value: 200 } }
				],
				meta: {
					total: 2,
					page: 1
				}
			};

			responseContext.json(complexBody);

			expect(mockJson).toHaveBeenCalledWith(complexBody);
		});

		test('should work with null JSON body', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => null);
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);
			responseContext.json(null);

			expect(mockJson).toHaveBeenCalledWith(null);
		});

		test('should work with empty object JSON body', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => ({}));
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);
			responseContext.json({});

			expect(mockJson).toHaveBeenCalledWith({});
		});

		test('should create independent response contexts for different Hono contexts', () => {
			const mockStatus1 = vi.fn(() => {});
			const mockJson1 = vi.fn(() => ({ data: 'test1' }));
			const mockContext1 = {
				status: mockStatus1,
				json: mockJson1
			} as any;

			const mockStatus2 = vi.fn(() => {});
			const mockJson2 = vi.fn(() => ({ data: 'test2' }));
			const mockContext2 = {
				status: mockStatus2,
				json: mockJson2
			} as any;

			const responseContext1 = getResponseContext(mockContext1);
			const responseContext2 = getResponseContext(mockContext2);

			responseContext1.status(200).json({ data: 'response1' });
			responseContext2.status(404).json({ data: 'response2' });

			expect(mockStatus1).toHaveBeenCalledWith(200);
			expect(mockJson1).toHaveBeenCalledWith({ data: 'response1' });
			expect(mockStatus2).toHaveBeenCalledWith(404);
			expect(mockJson2).toHaveBeenCalledWith({ data: 'response2' });
		});

		test('should handle multiple status calls', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => ({ data: 'test' }));
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);

			responseContext.status(200);
			responseContext.status(404);
			responseContext.status(500);

			expect(mockStatus).toHaveBeenCalledTimes(3);
			expect(mockStatus).toHaveBeenNthCalledWith(1, 200);
			expect(mockStatus).toHaveBeenNthCalledWith(2, 404);
			expect(mockStatus).toHaveBeenNthCalledWith(3, 500);
		});

		test('should handle multiple json calls', () => {
			const mockStatus = vi.fn(() => {});
			const mockJson = vi.fn(() => ({ data: 'test' }));
			const mockContext = {
				status: mockStatus,
				json: mockJson
			} as any;

			const responseContext = getResponseContext(mockContext);

			responseContext.json({ data: 1 });
			responseContext.json({ data: 2 });
			responseContext.json({ data: 3 });

			expect(mockJson).toHaveBeenCalledTimes(3);
			expect(mockJson).toHaveBeenNthCalledWith(1, { data: 1 });
			expect(mockJson).toHaveBeenNthCalledWith(2, { data: 2 });
			expect(mockJson).toHaveBeenNthCalledWith(3, { data: 3 });
		});
	});
});
