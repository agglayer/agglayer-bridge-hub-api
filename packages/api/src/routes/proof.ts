import { OpenAPIHono, createRoute } from '@hono/zod-openapi';

import { ClaimProofResponseSchema } from '@agglayer/bridge-hub-types';

import type { ProofService } from '../services/proof.ts';
import type { TransactionService } from '../services/transactions.ts';

import { ProofController } from '../controllers/proof.ts';
import { validateClaimProofQueryParams } from '../middlewares/validate_query_params.ts';
import { ClaimProofQuerySchema, NetworkSchema } from '../schemas/index.ts';

const createProofRoutes = (proofService: ProofService, transactionService: TransactionService) => {
	const proofRoutes = new OpenAPIHono();
	const proofController = new ProofController(proofService, transactionService);

	const getClaimProofRoute = createRoute({
		method: 'get',
		path: '/',
		tags: ['proof'],
		summary: 'Get claim proof',
		description: 'Retrieve the claim proof for a specific transaction',
		request: {
			params: NetworkSchema,
			query: ClaimProofQuerySchema
		},
		middleware: [validateClaimProofQueryParams],
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
				description: 'Bad request - invalid parameters'
			},
			404: {
				description: 'Claim proof not found'
			}
		}
	});

	proofRoutes.openapi(getClaimProofRoute, proofController.getProof);

	return proofRoutes;
};

export { createProofRoutes };
