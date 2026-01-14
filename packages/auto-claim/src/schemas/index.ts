import { z } from "@hono/zod-openapi";
import {
	HubTransactionSchema,
	ClaimProofSchema,
	PaginatedResponseSchema,
	ResponseSchema,
} from "@agglayer/bridge-hub-commons";

export { HubTransactionSchema } from "@agglayer/bridge-hub-commons";

export const PaginationResponseSchema = z.object({
	total: z.number(),
	limit: z.number(),
	nextStartAfterCursor: z.string().optional(),
});

export const TransactionResponseSchema = PaginatedResponseSchema(
	z.array(HubTransactionSchema)
);

export type ITransactionResponse = z.infer<typeof TransactionResponseSchema>;

export { ClaimProofSchema };
export const ClaimProofResponseSchema = ResponseSchema(ClaimProofSchema);
export type ClaimProofResponse = z.infer<typeof ClaimProofResponseSchema>;

export type IProof = z.infer<typeof ClaimProofSchema>;
export type IHubTransaction = z.infer<typeof HubTransactionSchema>;
