import { z } from "@hono/zod-openapi";
import { TransactionStatusSchema } from "../enums/transaction_status";

/**
 * Zod schema for the Hub API's Transaction entity with BRIDGED status
 */
export const HubBridgedStatusTransactionsSchema = z.object({
	sourceNetwork: z.number(),
	depositCount: z.number(),
	hubUID: z.string(),
	timestamp: z.number().optional(),
});

/**
 * Zod schema for the Hub API's Transaction entity with LEAF_INCLUDED status
 */
export const HubLeafIncludedStatusTransactionsSchema = z.object({
	sourceNetwork: z.number(),
	depositCount: z.number(),
	leafIndex: z.number(),
	hubUID: z.string(),
});

/**
 * Zod schema for the Hub API's Bridge Transaction entity
 */
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
	amount: z.string(),
	depositCount: z.number(),
	bridgeHash: z.string(),
	status: TransactionStatusSchema,
	lastUpdatedAt: z.number().optional(),
	txSender: z.string(),
});

/**
 * Zod schema for the Hub API's Claim Transaction entity
 */
export const HubClaimTransactionSchema = z.object({
	claimTransactionHash: z.string(),
	claimBlockNumber: z.number(),
	claimTimestamp: z.number(),
	globalIndex: z.string(),
	sourceNetwork: z.number(),
	depositCount: z.number(),
	status: TransactionStatusSchema,
	lastUpdatedAt: z.number().optional(),
});

/**
 * Combined schema that includes both bridge and claim transaction fields
 * This represents the full transaction document stored in MongoDB
 */
export const HubTransactionSchema = z.object({
	...HubBridgeTransactionSchema.shape,
	...HubClaimTransactionSchema.shape,
	leafIndex: z.number().optional(),
	leafIndexForProof: z.number().optional(),
});

// Export inferred TypeScript types
export type IHubBridgedStatusTransactions = z.infer<
	typeof HubBridgedStatusTransactionsSchema
>;
export type IHubLeafIncludedStatusTransactions = z.infer<
	typeof HubLeafIncludedStatusTransactionsSchema
>;
export type IHubBridgeTransaction = z.infer<typeof HubBridgeTransactionSchema>;
export type IHubClaimTransaction = z.infer<typeof HubClaimTransactionSchema>;
export type IHubTransaction = z.infer<typeof HubTransactionSchema>;
