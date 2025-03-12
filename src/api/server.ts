import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { config } from '../common/config';
import { Logger } from '../../packages/common/logger';
import { setupRoutes } from './routes';

export function createApp() {
    const app = new Elysia()
        .use(swagger({
            documentation: {
                info: {
                    title: 'Bridge HUB API Service',
                    version: '1.0.0'
                }
            }
        }))
        .use(cors())
        .derive(({ request }) => {
            const requestId = request.headers.get('x-request-id') || crypto.randomUUID();
            return {
                requestId
            };
        })
        .onError(({ code, error, set }: any) => {
            Logger.error(`Uncaught error: ${error.message}`);

            set.status = 500;
            return {
                status: 'error',
                message: config.environment === 'prod'
                    ? 'An internal server error occurred'
                    : error.message,
                code: 'INTERNAL_ERROR',
                timestamp: new Date().toISOString()
            };
        })
        .group('/api/v1', (app: any) => setupRoutes(app));

    return app;
}

export async function startServer() {
    const app = createApp();
    app.listen(config.port);
    Logger.info(`API server started on port ${config.port} in ${config.environment} mode`);
    return app;
}