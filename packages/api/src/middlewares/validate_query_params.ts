import type { MiddlewareHandler } from "hono";
import { NetworkSchema, PaginationSchema } from "../schemas/common";
import { BadRequestError, handleError } from "@polygonlabs/servercore";
import {
    ClaimProofQuerySchema,
    MappingsByOriginTokenQuerySchema,
    MappingsQuerySchema,
    TransactionsByDepositCountQuerySchema,
    TransactionsQuerySchema,
} from "../schemas";
import { getResponseContext } from "./response_context";

export const validateTransactionQueryParams: MiddlewareHandler = async (
    context,
    next
) => {
    const parsedParams = NetworkSchema.safeParse(context.req.param());
    const parsedQuery = TransactionsQuerySchema.safeParse(context.req.query());
    if (!parsedQuery.success) {
        const error = new BadRequestError(
            parsedQuery.error.message,
            parsedQuery.error.format(),
            undefined,
            "validateTransactionQueryParams"
        );

        return handleError(getResponseContext(context), error);
    } else if (!parsedParams.success) {
        const error = new BadRequestError(
            parsedParams.error.message,
            parsedParams.error.format(),
            undefined,
            "validateTransactionQueryParams"
        );

        return handleError(getResponseContext(context), error);
    }

    context.set("validatedQuery", parsedQuery.data);
    context.set("validatedParams", parsedParams.data);
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

            return handleError(getResponseContext(context), error);
        }

        context.set("validatedParams", parsedQuery.data);
        await next();
    };

export const validateMappingsQueryParams: MiddlewareHandler = async (
    context,
    next
) => {
    const parsedParams = NetworkSchema.safeParse(context.req.param());
    const parsedQuery = MappingsQuerySchema.safeParse(context.req.query());
    if (!parsedQuery.success) {
        const error = new BadRequestError(
            parsedQuery.error.message,
            parsedQuery.error.format(),
            undefined,
            "validateMappingsQueryParams"
        );

        return handleError(getResponseContext(context), error);
    } else if (!parsedParams.success) {
        const error = new BadRequestError(
            parsedParams.error.message,
            parsedParams.error.format(),
            undefined,
            "validateMappingsQueryParams"
        );

        return handleError(getResponseContext(context), error);
    }

    context.set("validatedQuery", parsedQuery.data);
    context.set("validatedParams", parsedParams.data);
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

            return handleError(getResponseContext(context), error);
        } else if (!parsedParams.success) {
            const error = new BadRequestError(
                parsedParams.error.message,
                parsedParams.error.format(),
                undefined,
                "validateMappingsByOriginTokenQueryParams"
            );

            return handleError(getResponseContext(context), error);
        }

        context.set("validatedQuery", parsedQuery.data);
        context.set("validatedParams", parsedParams.data);
        await next();
    };

export const validateClaimProofQueryParams: MiddlewareHandler = async (
    context,
    next
) => {
    const parsedParams = MappingsByOriginTokenQuerySchema.safeParse(
        context.req.param()
    );
    const parsedQuery = ClaimProofQuerySchema.safeParse(context.req.query());
    if (!parsedQuery.success) {
        const error = new BadRequestError(
            parsedQuery.error.message,
            parsedQuery.error.format(),
            undefined,
            "validateProofQueryParams"
        );

        return handleError(getResponseContext(context), error);
    } else if (!parsedParams.success) {
        const error = new BadRequestError(
            parsedParams.error.message,
            parsedParams.error.format(),
            undefined,
            "validateProofQueryParams"
        );

        return handleError(getResponseContext(context), error);
    }

    context.set("validatedQuery", parsedQuery.data);
    context.set("validatedParams", parsedParams.data);
    await next();
};
