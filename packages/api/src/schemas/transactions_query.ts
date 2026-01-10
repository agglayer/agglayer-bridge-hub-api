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
	type IHubBridgeTransaction,
	type IHubClaimTransaction,
} from "@agglayer/bridge-hub-types";

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
export { HubBridgeTransactionSchema, HubClaimTransactionSchema };

// API-specific schema that combines bridge + claim with optional fields
export const HubTransactionSchema = z.object({
	...HubBridgeTransactionSchema.shape,
	...HubClaimTransactionSchema.shape,
	leafIndex: z.number().optional(),
	leafIndexForProof: z.number().optional(),
});

export const TransactionResponseSchema =
	PaginatedResponseSchema(HubTransactionSchema);

export const TransactionByDepositCountResponseSchema =
	ResponseSchema(HubTransactionSchema);

export type TransactionsByDepositCountQuery = z.infer<
	typeof TransactionsByDepositCountQuerySchema
>;
export type TransactionsQuery = z.infer<typeof TransactionsQuerySchema>;

// Re-export types from shared package
export type { IHubBridgeTransaction, IHubClaimTransaction };

// API-specific type that combines bridge + claim fields
export type IHubTransaction = z.infer<typeof HubTransactionSchema>;
