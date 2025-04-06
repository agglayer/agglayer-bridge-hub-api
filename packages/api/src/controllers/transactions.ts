import type { Context } from "hono";
import { handleResponse } from "../utils/response_handler";
import { TransactionService } from "../services";
import type {
    IQueryFilterOperationParams,
    IQueryOrderOperationParams,
} from "bridge-hub-commons/interfaces/database";
import type {
    TransactionsByDepositCountQuery,
    TransactionsQuery,
} from "../schemas";

export const getTransactions = async (c: Context) => {
    const query: TransactionsQuery = c.get("validatedQuery");

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
            field: "sourceNetworkId",
            operator: "in",
            value: query.sourceNetworkIds,
        });
    }

    if (query.destinationNetworkIds) {
        queryParams.push({
            field: "destinationNetworkId",
            operator: "in",
            value: query.destinationNetworkIds,
        });
    }

    const transactions = await TransactionService.getTranasctions(
        queryParams,
        query.limit
    );

    return handleResponse(c, transactions);
};

export const getTransactionByDepositCount = async (c: Context) => {
    const { sourceNetworkId, depositCount }: TransactionsByDepositCountQuery =
        c.get("validatedQuery");

    const queryParams: IQueryFilterOperationParams[] = [
        {
            field: "sourceNetworkId",
            operator: "==",
            value: sourceNetworkId,
        },
        {
            field: "depositCount",
            operator: "==",
            value: depositCount,
        },
    ];

    const transactions = await TransactionService.getTranasctions(queryParams);

    return handleResponse(c, transactions[0]);
};
