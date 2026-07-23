import { createServer } from 'node:http';

import { Logger } from '@polygonlabs/servercore';

// @polygonlabs/servercore's setupHealthCheckServer calls Bun.serve()
// unconditionally, which throws `ReferenceError: Bun is not defined` under
// Node — see agglayer-bridge-hub-api#127. This is a minimal Node-native
// replacement implementing the same single-route contract (GET
// /health-check, calls the given check function, 200 on success / 503 on
// failure) so the consumer's liveness probe actually has something to hit.
export function startHealthCheckServer(port: number, check: () => Promise<boolean>): void {
	const server = createServer((req, res) => {
		if (req.method !== 'GET' || req.url !== '/health-check') {
			res.writeHead(404).end();
			return;
		}

		check()
			.then(() => {
				res
					.writeHead(200, { 'content-type': 'application/json' })
					.end(JSON.stringify({ status: 'ok' }));
			})
			.catch((error: unknown) => {
				const message = error instanceof Error ? error.message : String(error);
				res
					.writeHead(503, { 'content-type': 'application/json' })
					.end(JSON.stringify({ status: 'error', message }));
			});
	});

	server.listen(port, () => {
		Logger.info(`Health check server running on http://localhost:${port}/health-check`);
	});
}
