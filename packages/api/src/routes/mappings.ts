import type { OperationsManifest, TypedRegistry } from '@polygonlabs/openapi-registry';

import { PaginationSchema } from '../schemas/common.ts';
import {
	ApiErrorResponseSchema,
	MappingsByTokenQuerySchema,
	MappingsQuerySchema,
	MappingsResponseSchema,
	NetworkSchema
} from '../schemas/index.ts';

export const addMappingsRoutes = <Prev extends OperationsManifest>(r: TypedRegistry<Prev>) =>
	r
		.registerPath({
			operationId: 'getMappings',
			method: 'get',
			path: '/{network}/token-mappings',
			tags: ['mappings'],
			summary: 'Get token mappings',
			description: 'Retrieve a paginated list of token mappings between networks',
			request: {
				params: NetworkSchema,
				query: MappingsQuerySchema
			},
			responses: {
				200: {
					content: {
						'application/json': {
							schema: MappingsResponseSchema
						}
					},
					description: 'Successful response with token mappings'
				},
				400: {
					content: {
						'application/json': {
							schema: ApiErrorResponseSchema
						}
					},
					description: 'Bad request - invalid parameters'
				}
			}
		})
		.registerPath({
			operationId: 'getMappingsByToken',
			method: 'get',
			path: '/{network}/token-mappings/{tokenNetwork}/{tokenAddress}',
			tags: ['mappings'],
			summary: 'Get mappings by token',
			description: 'Retrieve token mappings for a specific token address and network',
			request: {
				params: MappingsByTokenQuerySchema,
				query: PaginationSchema
			},
			responses: {
				200: {
					content: {
						'application/json': {
							schema: MappingsResponseSchema
						}
					},
					description: 'Successful response with token mappings'
				},
				400: {
					content: {
						'application/json': {
							schema: ApiErrorResponseSchema
						}
					},
					description: 'Bad request - invalid parameters'
				},
				404: {
					content: {
						'application/json': {
							schema: ApiErrorResponseSchema
						}
					},
					description: 'Token mappings not found'
				}
			}
		});
