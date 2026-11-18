import type { OperationsManifest, TypedRegistry } from '@polygonlabs/openapi-registry';

import {
	ApiErrorResponseSchema,
	TokenMetadataQuerySchema,
	TokenMetadataResponseSchema
} from '../schemas/index.ts';

export const addTokenMetadataRoutes = <Prev extends OperationsManifest>(r: TypedRegistry<Prev>) =>
	r.registerPath({
		operationId: 'getTokenMetadata',
		method: 'get',
		path: '/{network}/token-metadata/{tokenAddress}',
		tags: ['token-metadata'],
		summary: 'Get token metadata',
		description:
			'Retrieve metadata for a specific token address including name, symbol, decimals, and other information',
		request: {
			params: TokenMetadataQuerySchema
		},
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
						schema: ApiErrorResponseSchema
					}
				},
				description: 'Bad request - invalid token address'
			},
			404: {
				content: {
					'application/json': {
						schema: ApiErrorResponseSchema
					}
				},
				description: 'Token metadata not found'
			}
		}
	});
