import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

import type { TokenMetadataService } from '../services/token_metadata.ts';

import { TokenMetadataController } from '../controllers/token_metadata.ts';
import { validateTokenMetadataQueryParams } from '../middlewares/validate_query_params.ts';
import { TokenMetadataQuerySchema, TokenMetadataResponseSchema } from '../schemas/index.ts';

const createTokenMetadataRoutes = (tokenMetadataService: TokenMetadataService) => {
	const tokenMetadataRoutes = new OpenAPIHono();
	const tokenMetadataController = new TokenMetadataController(tokenMetadataService);

	const ErrorResponseSchema = z.object({
		success: z.boolean(),
		error: z.string()
	});

	// GET /token-metadata/:tokenAddress route
	const getTokenMetadataRoute = createRoute({
		method: 'get',
		path: '/{tokenAddress}',
		tags: ['token-metadata'],
		summary: 'Get token metadata',
		description:
			'Retrieve metadata for a specific token address including name, symbol, decimals, and other information',
		request: {
			params: TokenMetadataQuerySchema
		},
		middleware: [validateTokenMetadataQueryParams],
		responses: {
			200: {
				content: {
					'application/json': {
						schema: TokenMetadataResponseSchema
					}
				},
				description: 'Successful response with token metadata'
			},
			400: {
				content: {
					'application/json': {
						schema: ErrorResponseSchema
					}
				},
				description: 'Bad request - invalid token address'
			},
			404: {
				content: {
					'application/json': {
						schema: ErrorResponseSchema
					}
				},
				description: 'Token metadata not found'
			}
		}
	});

	// Register routes
	tokenMetadataRoutes.openapi(getTokenMetadataRoute, tokenMetadataController.getTokenMetadata);

	return tokenMetadataRoutes;
};

export { createTokenMetadataRoutes };
