import { OpenAPIHono } from '@hono/zod-openapi';

import type { MappingsService } from '../services/mappings.ts';
import type { ProofService } from '../services/proof.ts';
import type { TokenMetadataService } from '../services/token_metadata.ts';
import type { TransactionService } from '../services/transactions.ts';

import { createMappingsRoutes } from './mappings.ts';
import { createProofRoutes } from './proof.ts';
import { createTokenMetadataRoutes } from './token_metadata.ts';
import { createTransactionsRoutes as createTransactionRoutes } from './transactions.ts';

const createRouter = (
	transactionService: TransactionService,
	mappingsService: MappingsService,
	proofService: ProofService,
	tokenMetadataService: TokenMetadataService
) => {
	const router = new OpenAPIHono();

	router.route('/transactions', createTransactionRoutes(transactionService));
	router.route('/token-mappings', createMappingsRoutes(mappingsService));
	router.route('/claim-proof', createProofRoutes(proofService, transactionService));
	router.route('/token-metadata', createTokenMetadataRoutes(tokenMetadataService));

	return router;
};

export { createRouter };
