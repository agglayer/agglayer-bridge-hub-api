import { z } from "zod";
import { networkIdsSchema, NetworkSchema, PaginationSchema } from "./common";
import { TransactionStatus } from "../enums";

export const TransactionsQuerySchema = z
    .object({
        fromAddress: z.string().optional(),
        sourceNetworkIds: networkIdsSchema.optional(),
        destinationNetworkIds: networkIdsSchema.optional(),
        updatedSince: z.coerce
            .number()
            .int()
            .nonnegative()
            .refine(
                (val) =>
                    val === undefined ||
                    (val >= 1000000000000 && val <= 9999999999999),
                {
                    message:
                        "updatedSince must be a valid Unix timestamp in milliseconds (13 digits)",
                }
            )
            .optional(),
        order: z.enum(["asc", "desc"]).optional(),
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
