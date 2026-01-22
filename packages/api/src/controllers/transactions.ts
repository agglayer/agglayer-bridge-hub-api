import type { Context } from "hono";
import { TransactionService } from "../services/transactions";
import type {
	TransactionsByDepositCountQuery,
	TransactionsQuery,
} from "../schemas";
import { handleResponse } from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export class TransactionsController {
	constructor(private readonly transactionService: TransactionService) {}

	getTransactions = async (c: Context) => {
		const query: TransactionsQuery = c.get("validatedQuery");
		const { network } = c.get("validatedParams");

		const transactions = await this.transactionService.getTransactions({
			network,
			fromAddress: query.fromAddress,
			sourceNetworkIds: query.sourceNetworkIds,
			destinationNetworkIds: query.destinationNetworkIds,
			updatedSince: query.updatedSince,
			status: query.status,
			order: query.order,
			startAfter: query.startAfter,
			limit: query.limit,
		});

		return handleResponse(getResponseContext(c), transactions.documents, {
			total: transactions?.totalDocumentsCount || 0,
			limit: query.limit,
			nextStartAfterCursor: transactions?.documents.at(-1)?.hubUID,
		});
	};

	getTransactionByDepositCount = async (c: Context) => {
		const {
			sourceNetworkId,
			depositCount,
			network,
		}: TransactionsByDepositCountQuery = c.get("validatedParams");

		const docId: string = this.transactionService.generateDocId(
			depositCount,
			sourceNetworkId
		);

		const transaction =
			await this.transactionService.getTransactionByDepositCount(
				network,
				docId
			);

		return handleResponse(getResponseContext(c), transaction);
	};
}
