import { z } from 'zod';

import type { OperationsManifest, TypedRegistry } from '@polygonlabs/openapi-registry';

import { ResponseSchema } from '@agglayer/bridge-hub-types';

export const HealthCheckResponseSchema = ResponseSchema(
	z.object({
		status: z.string(),
		message: z.string()
	})
);

export const addHealthCheckRoutes = <Prev extends OperationsManifest>(r: TypedRegistry<Prev>) =>
	r.registerPath({
		operationId: 'checkServiceHealth',
		method: 'get',
		path: '/health-check',
		tags: ['health-check'],
		summary: 'Service health check',
		description: 'Reports whether the API and its dependencies are working correctly',
		responses: {
			200: {
				content: {
					'application/json': {
						schema: HealthCheckResponseSchema
					}
				},
				description: 'Service is healthy'
			}
		}
	});
