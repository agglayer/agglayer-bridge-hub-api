import { z } from "zod";
import {
	address,
	networkIdsSchema,
	NetworkSchema,
	PaginationSchema,
} from "./common";
import { TransactionStatus } from "../enums";

export const TransactionsQuerySchema = z
	.object({
		fromAddress: address.optional(),
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
		sourceNetworkId: z
			.string()
			.regex(/^\d*$/, "sourceNetworkId must be a non-negative integer")
			.transform((val) => parseInt(val, 10)),
		depositCount: z
			.string()
			.regex(/^\d*$/, "depositCount must be a non-negative integer")
			.transform((val) => parseInt(val, 10)),
	})
	.merge(NetworkSchema);

export type TransactionsByDepositCountQuery = z.infer<
	typeof TransactionsByDepositCountQuerySchema
>;
export type TransactionsQuery = z.infer<typeof TransactionsQuerySchema>;
