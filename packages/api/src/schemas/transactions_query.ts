import { z } from "zod";
import { networkIdsSchema, PaginationSchema } from "./common";

export const TransactionsQuerySchema = z
    .object({
        fromAddress: z.string().optional(),
        sourceNetworkIds: networkIdsSchema.optional(),
        destinationNetworkIds: networkIdsSchema.optional(),
    })
    .merge(PaginationSchema);

export const TransactionsByDepositCountQuerySchema = z.object({
    sourceNetworkId: z.number().int().nonnegative(),
    depositCount: z.number().int().nonnegative(),
});

export type TransactionsByDepositCountQuery = z.infer<
    typeof TransactionsByDepositCountQuerySchema
>;
export type TransactionsQuery = z.infer<typeof TransactionsQuerySchema>;
