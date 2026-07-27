import type { OperationsManifest, TypedRegistry } from '@polygonlabs/openapi-registry';

import { ClaimProofResponseSchema } from '@agglayer/bridge-hub-types';

import { ApiErrorResponseSchema, ClaimProofQuerySchema, NetworkSchema } from '../schemas/index.ts';

export const addProofRoutes = <Prev extends OperationsManifest>(r: TypedRegistry<Prev>) =>
	r.registerPath({
		operationId: 'getClaimProof',
		method: 'get',
		path: '/{network}/claim-proof',
		tags: ['proof'],
		summary: 'Get claim proof',
		description: 'Retrieve the claim proof for a specific transaction',
		request: {
			params: NetworkSchema,
			query: ClaimProofQuerySchema
		},
		responses: {
			200: {
				content: {
					'application/json': {
						schema: ClaimProofResponseSchema
					}
				},
				description: 'Successful response with claim proof'
			},
			400: {
				content: {
					'application/json': {
						schema: ApiErrorResponseSchema
					}
				},
				description: 'Bad request - invalid parameters or transaction not ready to claim'
			},
			404: {
				content: {
					'application/json': {
						schema: ApiErrorResponseSchema
					}
				},
				description: 'Claim proof not found'
			}
		}
	});
