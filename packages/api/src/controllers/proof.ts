import type { Context } from 'hono';

import type { ApiError, ExternalDependencyError } from '@polygonlabs/servercore';

import {
	BadRequestError,
	handleError,
	handleResponse,
	NotFoundError
} from '@polygonlabs/servercore';

import type { ClaimProofQuery } from '../schemas/index.ts';
import type { ProofService } from '../services/proof.ts';
import type { TransactionService } from '../services/transactions.ts';

import { getResponseContext } from '../middlewares/response_context.ts';

export class ProofController {
	private readonly proofService: ProofService;
	private readonly transactionService: TransactionService;

	constructor(proofService: ProofService, transactionService: TransactionService) {
		this.proofService = proofService;
		this.transactionService = transactionService;
	}

	getProof = async (c: Context) => {
		try {
			const validatedQuery: ClaimProofQuery = c.get('validatedQuery');
			const { network } = c.get('validatedParams');

			if (validatedQuery.leafIndex == null) {
				const docId = this.transactionService.generateDocId(
					validatedQuery.depositCount,
					validatedQuery.sourceNetworkId
				);

				const transaction = await this.transactionService.getTransactionByDepositCount(
					network,
					docId
				);

				if (!transaction) {
					throw new NotFoundError(
						'Transaction not found for the given deposit count and source networkId',
						undefined,
						undefined,
						{
							network: network,
							sourceNetwork: validatedQuery.sourceNetworkId,
							depositCount: validatedQuery.depositCount
						}
					);
				} else if (transaction.status === 'READY_TO_CLAIM' && transaction.leafIndexForProof) {
					validatedQuery.leafIndex = transaction.leafIndexForProof;
				} else if (transaction.status === 'CLAIMED') {
					throw new BadRequestError('Transaction already claimed');
				} else {
					throw new BadRequestError('Transaction not ready to claim');
				}
			}

			// By here leafIndex is either supplied in the query or back-filled
			// from a READY_TO_CLAIM transaction above; guard to narrow the
			// optional type for getProof (which requires a number) rather than
			// asserting non-null.
			if (validatedQuery.leafIndex == null) {
				throw new BadRequestError('Transaction not ready to claim');
			}

			const proof = await this.proofService.getProof(
				network,
				validatedQuery.sourceNetworkId,
				validatedQuery.depositCount,
				validatedQuery.leafIndex
			);

			return handleResponse(getResponseContext(c), proof);
		} catch (error) {
			return handleError(getResponseContext(c), error as ExternalDependencyError | ApiError);
		}
	};
}
