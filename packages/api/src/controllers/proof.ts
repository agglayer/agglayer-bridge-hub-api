import type { Handler } from '@polygonlabs/express/registry';
import type { ApiError, ExternalDependencyError } from '@polygonlabs/servercore';

import {
	BadRequestError,
	handleError,
	handleResponse,
	NotFoundError
} from '@polygonlabs/servercore';

import type { Operations } from '../registry.ts';
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

	getProof: Handler<Operations['getClaimProof']> = async (req, res) => {
		try {
			const { network } = req.params;
			const query = req.query;

			let leafIndex = query.leafIndex;

			if (leafIndex == null) {
				const docId = this.transactionService.generateDocId(
					query.depositCount,
					query.sourceNetworkId
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
							sourceNetwork: query.sourceNetworkId,
							depositCount: query.depositCount
						}
					);
				} else if (transaction.status === 'READY_TO_CLAIM' && transaction.leafIndexForProof) {
					leafIndex = transaction.leafIndexForProof;
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
			if (leafIndex == null) {
				throw new BadRequestError('Transaction not ready to claim');
			}

			const proof = await this.proofService.getProof(
				network,
				query.sourceNetworkId,
				query.depositCount,
				leafIndex
			);

			handleResponse(getResponseContext(res), proof);
		} catch (error) {
			handleError(getResponseContext(res), error as ExternalDependencyError | ApiError);
		}
	};
}
