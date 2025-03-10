import { Elysia } from 'elysia';
import { setupProofApiRoutes } from './proof';

export function setupRoutes(app: Elysia): Elysia {
    app.get('/merkle-proof', setupProofApiRoutes(app));
    return app;
}