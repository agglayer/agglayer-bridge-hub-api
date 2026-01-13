import { z } from "@hono/zod-openapi";
import { TransactionStatusSchema } from "../enums/transaction_status";

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

// Export inferred TypeScript type
export type IHubClaimTransaction = z.infer<typeof HubClaimTransactionSchema>;
