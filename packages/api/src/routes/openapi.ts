import type { Router as RouterType } from 'express';

import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { apiReference } from '@scalar/express-api-reference';
import { Router } from 'express';

import type { TypedRegistry } from '@polygonlabs/openapi-registry';

export function createOpenApiRouter(registry: TypedRegistry): RouterType {
	const spec = new OpenApiGeneratorV3(registry.definitions).generateDocument({
		openapi: '3.0.0',
		info: {
			version: 'v1',
			title: 'Agglayer Bridge Hub API',
			description:
				'The Agglayer Bridge Hub API provides access to query agglayer bridge transaction statuses, retrieve token address mappings across chains, generate claim proofs for asset withdrawals, and access comprehensive token metadata. Supports mainnet, testnet, and devnet environments for seamless integration with bridge-enabled applications.'
		},
		servers: [
			{
				url: process.env.API_BASE_URL || 'http://localhost:3001',
				description:
					process.env.NODE_ENV === 'prod-api' ? 'Production server' : 'Development server'
			}
		]
	});

	const router: RouterType = Router();

	router.get('/openapi', (_req, res) => {
		res.json(spec);
	});

	// Scalar API Reference UI
	router.use('/docs', apiReference({ content: spec }));

	return router;
}
