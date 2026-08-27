import { describe, test, expect, beforeEach } from 'vitest';

import { ClaimCircuitBreaker } from '../../src/services/circuit-breaker.ts';

describe('ClaimCircuitBreaker', () => {
	let breaker: ClaimCircuitBreaker;
	const key = ClaimCircuitBreaker.keyFor(1, 42);

	beforeEach(() => {
		breaker = new ClaimCircuitBreaker({ failureThreshold: 3, retryWindowTicks: 2 });
	});

	test('does not skip a fresh transaction', () => {
		expect(breaker.shouldSkip(key)).toBe(false);
	});

	test('trips after the configured number of consecutive failures and then skips', () => {
		expect(breaker.recordFailure(key)).toBe(false);
		expect(breaker.recordFailure(key)).toBe(false);
		expect(breaker.recordFailure(key)).toBe(true); // 3rd failure trips it

		expect(breaker.shouldSkip(key)).toBe(true);
	});

	test('resets on success, un-skipping the transaction', () => {
		breaker.recordFailure(key);
		breaker.recordFailure(key);
		breaker.recordFailure(key);
		expect(breaker.shouldSkip(key)).toBe(true);

		breaker.recordSuccess(key);

		expect(breaker.shouldSkip(key)).toBe(false);
		// consecutive-failure count is cleared too, not just the tripped flag
		expect(breaker.recordFailure(key)).toBe(false);
	});

	test('allows exactly one retry attempt per retry window while tripped', () => {
		breaker.recordFailure(key);
		breaker.recordFailure(key);
		breaker.recordFailure(key);

		expect(breaker.shouldSkip(key)).toBe(true); // tick 1
		expect(breaker.shouldSkip(key)).toBe(false); // tick 2 (retryWindowTicks=2) — retry allowed
		expect(breaker.shouldSkip(key)).toBe(true); // tick 3 — window restarted, skip again
	});

	test('tracks separate transactions independently', () => {
		const otherKey = ClaimCircuitBreaker.keyFor(1, 43);

		breaker.recordFailure(key);
		breaker.recordFailure(key);
		breaker.recordFailure(key);

		expect(breaker.shouldSkip(key)).toBe(true);
		expect(breaker.shouldSkip(otherKey)).toBe(false);
	});
});
