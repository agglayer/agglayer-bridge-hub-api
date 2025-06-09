import type { MiddlewareHandler } from "hono";
import {
    TransactionsByDepositCountQuerySchema,
    TransactionsQuerySchema,
} from "../schemas/transactions_query";
import { handleError } from "../utils/response_handler";
import {
    MappingsByOriginTokenQuerySchema,
    MappingsQuerySchema,
} from "../schemas/mappings_query";
import { PaginationSchema } from "../schemas/common";
import { BadRequestError } from "@polygonlabs/servercore";

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
                "validateTransactionByDepositCountQueryParams"
            );

            return handleError(context, error);
        }

        context.set("validatedParams", parsedQuery.data);
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

export const validateMappingsByOriginTokenQueryParams: MiddlewareHandler =
    async (context, next) => {
        const parsedParams = MappingsByOriginTokenQuerySchema.safeParse(
            context.req.param()
        );

        const parsedQuery = PaginationSchema.safeParse(context.req.query());

        if (!parsedQuery.success) {
            const error = new BadRequestError(
                parsedQuery.error.message,
                parsedQuery.error.format(),
                undefined,
                "validateMappingsByOriginTokenQueryParams"
            );

            return handleError(context, error);
        } else if (!parsedParams.success) {
            const error = new BadRequestError(
                parsedParams.error.message,
                parsedParams.error.format(),
                undefined,
                "validateMappingsByOriginTokenQueryParams"
            );

            return handleError(context, error);
        }

        context.set("validatedQuery", parsedQuery.data);
        context.set("validatedParams", parsedParams.data);
        await next();
    };
