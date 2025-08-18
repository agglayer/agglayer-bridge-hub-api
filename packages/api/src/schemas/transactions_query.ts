import { z } from "zod";
import { networkIdsSchema, NetworkSchema, PaginationSchema } from "./common";

export const TransactionsQuerySchema = z
    .object({
        fromAddress: z.string().optional(),
        sourceNetworkIds: networkIdsSchema.optional(),
        destinationNetworkIds: networkIdsSchema.optional(),
    })
    .merge(PaginationSchema)
    .merge(NetworkSchema);

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
