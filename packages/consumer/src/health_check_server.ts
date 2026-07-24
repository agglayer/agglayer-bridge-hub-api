import express from 'express';

import { createErrorHandler, getLogger, notFoundHandler, setupLogger } from '@polygonlabs/express';
import { createLogger } from '@polygonlabs/logger';

// @polygonlabs/servercore's setupHealthCheckServer calls Bun.serve()
// unconditionally, which throws `ReferenceError: Bun is not defined` under
// Node — see agglayer-bridge-hub-api#127. This is the team-standard
// @polygonlabs/express replacement, implementing the same single-route
// contract (GET /health-check, calls the given check function, 200 on
// success / 503 on failure) so the consumer's liveness probe actually has
// something to hit.
export async function startHealthCheckServer(
	port: number,
	check: () => Promise<boolean>
): Promise<void> {
	const logger = await createLogger();
	const app = express();

	app.use(setupLogger(logger));

	app.get('/health-check', async (_req, res) => {
		try {
			await check();
			res.status(200).json({ status: 'ok' });
		} catch (error) {
			getLogger().warn({ err: error }, 'health check failed');
			const message = error instanceof Error ? error.message : String(error);
			res.status(503).json({ status: 'error', message });
		}
	});

	app.use(notFoundHandler);
	app.use(createErrorHandler());

	await new Promise<void>((resolve) => {
		app.listen(port, () => {
			getLogger().info(`Health check server running on http://localhost:${port}/health-check`);
			resolve();
		});
	});
}
