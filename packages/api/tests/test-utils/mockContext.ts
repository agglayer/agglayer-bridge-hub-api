import type { Context } from "hono";
import { mock } from "bun:test";

export interface MockContextOptions {
	validatedQuery?: any;
	validatedParams?: any;
	responseContext?: any;
}

export function createMockContext(options: MockContextOptions = {}): Context {
	const mockGet = mock((key: string) => {
		switch (key) {
			case "validatedQuery":
				return options.validatedQuery || {};
			case "validatedParams":
				return options.validatedParams || {};
			case "responseContext":
				return options.responseContext || {};
			default:
				return undefined;
		}
	});

	return {
		get: mockGet,
	} as unknown as Context;
}

export const mockResponseContext = {
	requestId: "test-request-id",
	correlationId: "test-correlation-id",
	userAgent: "test-user-agent",
	clientIp: "127.0.0.1",
	timestamp: Date.now(),
};
