// Global test setup for the consumer package
import { beforeAll, afterAll, beforeEach, afterEach } from "bun:test";

beforeAll(() => {
	// Setup global test environment
	process.env.NODE_ENV = "test";
});

afterAll(() => {
	// Cleanup after all tests
});

beforeEach(() => {
	// Setup before each test
});

afterEach(() => {
	// Cleanup after each test
});
