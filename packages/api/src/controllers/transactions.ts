import type { Handler } from '@polygonlabs/express/registry';

import { handleError, handleResponse, NotFoundError } from '@polygonlabs/servercore';

import type { Operations } from '../registry.ts';
import type { TransactionService } from '../services/transactions.ts';

import { getResponseContext } from '../middlewares/response_context.ts';

export class TransactionsController {
	private readonly transactionService: TransactionService;

	constructor(transactionService: TransactionService) {
		this.transactionService = transactionService;
	}

	getTransactions: Handler<Operations['getTransactions']> = async (req, res) => {
		const { network } = req.params;
		const query = req.query;

		const transactions = await this.transactionService.getTransactions({
			network,
			fromAddress: query.fromAddress,
			sourceNetworkIds: query.sourceNetworkIds,
			destinationNetworkIds: query.destinationNetworkIds,
			updatedSince: query.updatedSince,
			status: query.status,
			order: query.order,
			startAfter: query.startAfter,
			limit: query.limit
		});

		handleResponse(getResponseContext(res), transactions.documents, {
			total: transactions?.totalDocumentsCount || 0,
			limit: query.limit,
			nextStartAfterCursor: transactions?.documents.at(-1)?.hubUID
		});
	};

	getTransactionByDepositCount: Handler<Operations['getTransactionByDepositCount']> = async (
		req,
		res
	) => {
		const { sourceNetworkId, depositCount, network } = req.params;

		const docId: string = this.transactionService.generateDocId(depositCount, sourceNetworkId);

		const transaction = await this.transactionService.getTransactionByDepositCount(network, docId);

		if (!transaction) {
			handleError(
				getResponseContext(res),
				new NotFoundError(
					'Transaction not found for the given deposit count and source network',
					'Transaction',
					docId,
					{
						network,
						sourceNetworkId,
						depositCount
					}
				)
			);
			return;
		}

		handleResponse(getResponseContext(res), transaction);
	};
}
