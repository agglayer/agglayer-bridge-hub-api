import { z } from "@hono/zod-openapi";
import {
	address,
	networkIdsSchema,
	NetworkSchema,
	PaginationSchema,
	PaginatedResponseSchema,
	ResponseSchema,
} from "./common";
import { TransactionStatus } from "../enums";

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
		status: z
			.enum(Object.values(TransactionStatus) as [string, ...string[]])
			.optional(),
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

export const HubBridgeTransactionSchema = z.object({
	hubUID: z.string(),
	transactionHash: z.string(),
	blockNumber: z.number(),
	transactionIndex: z.number(),
	timestamp: z.number(),
	leafType: z.enum(["ASSET", "MESSAGE"]),
	originTokenNetwork: z.number(),
	originTokenAddress: z.string(),
	sourceNetwork: z.number(),
	destinationNetwork: z.number(),
	receiverAddress: z.string(),
	fromAddress: z.string(),
	amount: z.number(),
	depositCount: z.number(),
	bridgeHash: z.string(),
	status: z.enum(Object.values(TransactionStatus) as [string, ...string[]]),
	lastUpdatedAt: z.number(),
	txSender: z.string(),
	metadata: z.string(),
});

export const HubClaimTransactionSchema = z.object({
	claimTransactionHash: z.string(),
	claimBlockNumber: z.number(),
	claimTimestamp: z.number(),
	globalIndex: z.number(),
	sourceNetwork: z.number(),
	depositCount: z.number(),
	status: z.enum(Object.values(TransactionStatus) as [string, ...string[]]),
	lastUpdatedAt: z.number(),
});

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
export type IHubBridgeTransaction = z.infer<typeof HubBridgeTransactionSchema>;
export type IHubClaimTransaction = z.infer<typeof HubClaimTransactionSchema>;
export type IHubTransaction = z.infer<typeof HubTransactionSchema>;
