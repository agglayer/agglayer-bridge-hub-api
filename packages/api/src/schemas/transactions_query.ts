import { z } from "@hono/zod-openapi";
import {
	address,
	networkIdsSchema,
	NetworkSchema,
	PaginationSchema,
	PaginatedResponseSchema,
	ResponseSchema,
} from "./common";
import {
	TransactionStatusSchema,
	HubBridgeTransactionSchema,
	HubClaimTransactionSchema,
	HubTransactionSchema,
	type IHubBridgeTransaction,
	type IHubClaimTransaction,
	type IHubTransaction,
} from "@agglayer/bridge-hub-commons";

export const TransactionsQuerySchema = z
	.object({
		fromAddress: address
			.nonempty()
			.transform((val) => val.toLowerCase())
			.optional(),
		sourceNetworkIds: networkIdsSchema.optional(),
		destinationNetworkIds: networkIdsSchema.optional(),
		updatedSince: z.coerce
			.number()
			.int()
			.nonnegative()
			.min(
				1000000000000,
				"updatedSince must be a valid Unix timestamp in milliseconds (13 digits)"
			)
			.max(
				9999999999999,
				"updatedSince must be a valid Unix timestamp in milliseconds (13 digits)"
			)
			.optional(),
		order: z.enum(["asc", "desc"]).optional(),
		status: TransactionStatusSchema.optional(),
	})
	.merge(PaginationSchema);

export const TransactionsByDepositCountQuerySchema = z
	.object({
		sourceNetworkId: z
			.string()
			.max(18, "Network IDs string must not exceed 18 characters")
			.regex(/^\d+$/, "sourceNetworkId must be a non-negative integer")
			.transform((val) => parseInt(val, 10)),
		depositCount: z
			.string()
			.max(18, "Network IDs string must not exceed 18 characters")
			.regex(/^\d+$/, "depositCount must be a non-negative integer")
			.transform((val) => parseInt(val, 10)),
	})
	.merge(NetworkSchema);

// Re-export schemas from shared types package
export {
	HubBridgeTransactionSchema,
	HubClaimTransactionSchema,
	HubTransactionSchema,
};

export const TransactionResponseSchema =
	PaginatedResponseSchema(HubTransactionSchema);

export const TransactionByDepositCountResponseSchema =
	ResponseSchema(HubTransactionSchema);

export type TransactionsByDepositCountQuery = z.infer<
	typeof TransactionsByDepositCountQuerySchema
>;
export type TransactionsQuery = z.infer<typeof TransactionsQuerySchema>;

// Re-export types from shared package
export type { IHubBridgeTransaction, IHubClaimTransaction, IHubTransaction };
