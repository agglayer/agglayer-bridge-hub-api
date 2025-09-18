import type { Context } from "hono";
import { TransactionService } from "../services";
import type {
	TransactionsByDepositCountQuery,
	TransactionsQuery,
} from "../schemas";
import {
	handleResponse,
	type IQueryFilterOperationParams,
	type IQueryOrderOperationParams,
} from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export const getTransactions = async (c: Context) => {
	const query: TransactionsQuery = c.get("validatedQuery");
	const { network } = c.get("validatedParams");

	// Create query params for db request
	const queryParams: IQueryFilterOperationParams[] = [];
	let orderParams: IQueryOrderOperationParams[] | undefined = undefined;

	if (query.fromAddress) {
		queryParams.push({
			field: "fromAddress",
			operator: "==",
			value: query.fromAddress,
		});
	}

	if (query.sourceNetworkIds) {
		queryParams.push({
			field: "sourceNetwork",
			operator: "in",
			value: query.sourceNetworkIds,
		});
	}

	if (query.destinationNetworkIds) {
		queryParams.push({
			field: "destinationNetwork",
			operator: "in",
			value: query.destinationNetworkIds,
		});
	}

	if (query.updatedSince) {
		queryParams.push({
			field: "lastUpdatedAt",
			operator: ">=",
			value: query.updatedSince,
		});

		orderParams = [{ field: "lastUpdatedAt", order: query.order || "asc" }];
	}

	if (query.order) {
		orderParams = [{ field: "hubUID", order: query.order }];
	}

	if (query.status) {
		queryParams.push({
			field: "status",
			operator: "==",
			value: query.status,
		});
	}

	const transactions = await TransactionService.getTransactions(
		network,
		queryParams,
		query.limit,
		query.startAfter,
		orderParams
	);

	return handleResponse(getResponseContext(c), transactions.documents, {
		total: transactions?.totalDocumentsCount || 0,
		limit: query.limit,
		nextStartAfterCursor: transactions?.documents.at(-1)?.hubUID,
	});
};

export const getTransactionByDepositCount = async (c: Context) => {
	const {
		sourceNetworkId,
		depositCount,
		network,
	}: TransactionsByDepositCountQuery = c.get("validatedParams");

	const docId: string = TransactionService.generateDocId(
		depositCount,
		sourceNetworkId
	);

	const transaction = await TransactionService.getTransactionByDepositCount(
		network,
		docId
	);

	return handleResponse(getResponseContext(c), transaction);
};
