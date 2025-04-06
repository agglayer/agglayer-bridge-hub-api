import type { MiddlewareHandler } from "hono";
import {
    TransactionsByDepositCountQuerySchema,
    TransactionsQuerySchema,
} from "../schemas/transactions_query";
import { BadRequestError } from "bridge-hub-commons/errors";
import { handleError } from "../utils/response_handler";
import { MappingsQuerySchema } from "../schemas/mappings_query";

export const validateTransactionQueryParams: MiddlewareHandler = async (
    context,
    next
) => {
    const parsedQuery = TransactionsQuerySchema.safeParse(context.req.query());
    if (!parsedQuery.success) {
        const error = new BadRequestError(
            parsedQuery.error.message,
            parsedQuery.error.format(),
            undefined,
            "validateTransactionQueryParams"
        );

        return handleError(context, error);
    }

    context.set("validatedQuery", parsedQuery.data);
    await next();
};

export const validateTransactionByDepositCountQueryParams: MiddlewareHandler =
    async (context, next) => {
        const parsedQuery = TransactionsByDepositCountQuerySchema.safeParse(
            context.req.param()
        );
        if (!parsedQuery.success) {
            const error = new BadRequestError(
                parsedQuery.error.message,
                parsedQuery.error.format(),
                undefined,
                "validateTransactionQueryParams"
            );

            return handleError(context, error);
        }

        context.set("validatedQuery", parsedQuery.data);
        await next();
    };

export const validateMappingsQueryParams: MiddlewareHandler = async (
    context,
    next
) => {
    const parsedQuery = MappingsQuerySchema.safeParse(context.req.query());
    if (!parsedQuery.success) {
        const error = new BadRequestError(
            parsedQuery.error.message,
            parsedQuery.error.format(),
            undefined,
            "validateMappingsQueryParams"
        );

        return handleError(context, error);
    }

    context.set("validatedQuery", parsedQuery.data);
    await next();
};
