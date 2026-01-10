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
	amount: z.number(),
	depositCount: z.number(),
	bridgeHash: z.string(),
	status: TransactionStatusSchema,
	lastUpdatedAt: z.number(),
	txSender: z.string(),
	metadata: z.string(),
});

// Export inferred TypeScript types
export type IHubBridgedStatusTransactions = z.infer<
	typeof HubBridgedStatusTransactionsSchema
>;
export type IHubLeafIncludedStatusTransactions = z.infer<
	typeof HubLeafIncludedStatusTransactionsSchema
>;
export type IHubBridgeTransaction = z.infer<typeof HubBridgeTransactionSchema>;
