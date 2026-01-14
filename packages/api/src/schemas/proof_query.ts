import { z } from "@hono/zod-openapi";
import { ClaimProofSchema, ResponseSchema } from "@agglayer/bridge-hub-commons";

export const ClaimProofQuerySchema = z.object({
	sourceNetworkId: z.coerce.number().int().nonnegative(),
	leafIndex: z.coerce.number().int().nonnegative().optional(),
	depositCount: z.coerce.number().int().nonnegative(),
});

export const ClaimProofResponseSchema = ResponseSchema(ClaimProofSchema);

export type ClaimProofQuery = z.infer<typeof ClaimProofQuerySchema>;
export type ClaimProofResponse = z.infer<typeof ClaimProofResponseSchema>;
export type ClaimProof = z.infer<typeof ClaimProofSchema>;
