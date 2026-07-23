import { describe, test, expect, beforeAll } from 'vitest';

import { Logger } from '@polygonlabs/servercore';

import { startHealthCheckServer } from '../src/health_check_server.ts';

// Regression test for agglayer-bridge-hub-api#127 / the 2026-07-23 incident:
// @polygonlabs/servercore's setupHealthCheckServer calls Bun.serve()
// unconditionally, which throws `ReferenceError: Bun is not defined` under
// Node. This exercises the Node-native replacement end to end over a real
// HTTP request, which the old code could never do under Node at all.
describe('startHealthCheckServer', () => {
	const port = 34521;
	const baseUrl = `http://localhost:${port}/health-check`;
	const state = { shouldSucceed: true };

	beforeAll(() => {
		Logger.create({});
		startHealthCheckServer(port, async () => {
			if (!state.shouldSucceed) {
				throw new Error('database unreachable');
			}
			return true;
		});
	});

	test('responds 200 with status ok when the check succeeds', async () => {
		state.shouldSucceed = true;

		const response = await fetch(baseUrl);
		const body = await response.json();

		expect(response.status).toBe(200);
		expect(body).toEqual({ status: 'ok' });
	});

	test('responds 503 with the error message when the check fails', async () => {
		state.shouldSucceed = false;

		const response = await fetch(baseUrl);
		const body = await response.json();

		expect(response.status).toBe(503);
		expect(body).toEqual({ status: 'error', message: 'database unreachable' });
	});

	test('responds 404 for any other path', async () => {
		state.shouldSucceed = true;

		const response = await fetch(`http://localhost:${port}/not-health-check`);

		expect(response.status).toBe(404);
	});
});
