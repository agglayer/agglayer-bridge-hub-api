import { z } from "zod";
import { networkIdsSchema, NetworkSchema, PaginationSchema } from "./common";
import { TransactionStatus } from "../enums";

export const TransactionsQuerySchema = z
    .object({
        fromAddress: z.string().optional(),
        sourceNetworkIds: networkIdsSchema.optional(),
        destinationNetworkIds: networkIdsSchema.optional(),
        status: z
            .enum(Object.values(TransactionStatus) as [string, ...string[]])
            .optional(),
    })
    .merge(PaginationSchema);

export const TransactionsByDepositCountQuerySchema = z
    .object({
        sourceNetworkId: z.coerce.number().int().nonnegative(),
        depositCount: z.coerce.number().int().nonnegative(),
    })
    .merge(NetworkSchema);

export type TransactionsByDepositCountQuery = z.infer<
    typeof TransactionsByDepositCountQuerySchema
>;
export type TransactionsQuery = z.infer<typeof TransactionsQuerySchema>;
