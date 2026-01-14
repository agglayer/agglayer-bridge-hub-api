import { z } from "@hono/zod-openapi";
import { HubBridgeTransactionSchema } from "./bridge_transaction";
import { HubClaimTransactionSchema } from "./claim_transaction";

// Export Zod schemas
export {
	HubBridgeTransactionSchema,
	HubBridgedStatusTransactionsSchema,
	HubLeafIncludedStatusTransactionsSchema,
} from "./bridge_transaction";
export { HubClaimTransactionSchema } from "./claim_transaction";
export { HubTokenMappingsSchema } from "./token_mapping";

// Export inferred TypeScript types
export type {
	IHubBridgeTransaction,
	IHubBridgedStatusTransactions,
	IHubLeafIncludedStatusTransactions,
} from "./bridge_transaction";
export type { IHubClaimTransaction } from "./claim_transaction";
export type { IHubTokenMappings } from "./token_mapping";

// API-specific schema that combines bridge + claim with optional fields
export const HubTransactionSchema = z.object({
	...HubBridgeTransactionSchema.shape,
	...HubClaimTransactionSchema.shape,
	leafIndex: z.number().optional(),
	leafIndexForProof: z.number().optional(),
});

export const PaginationResponseSchema = z.object({
	total: z.number(),
	limit: z.number(),
	nextStartAfterCursor: z.string().optional(),
});

export const ResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		data: dataSchema,
	});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
	dataSchema: T
) =>
	z.object({
		success: z.boolean(),
		data: dataSchema,
		pagination: PaginationResponseSchema,
	});

export { ClaimProofSchema } from "./claim_proof";
