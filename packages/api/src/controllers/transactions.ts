import type { Context } from "hono";
import { TransactionService } from "../services";
import type {
    TransactionsByDepositCountQuery,
    TransactionsQuery,
} from "../schemas";
import {
    handleResponse,
    type IQueryFilterOperationParams,
} from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export const getTransactions = async (c: Context) => {
    const query: TransactionsQuery = c.get("validatedQuery");
    const { network } = c.get("validatedParams");

    // Create query params for db request
    const queryParams: IQueryFilterOperationParams[] = [];

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

    const transactions = await TransactionService.getTransactions(
        network,
        queryParams,
        query.limit,
        query.startAfter
    );

    return handleResponse(getResponseContext(c), transactions);
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
