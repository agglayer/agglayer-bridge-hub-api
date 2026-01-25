import { z } from "@hono/zod-openapi";

export const ClaimProofQuerySchema = z.object({
	sourceNetworkId: z.coerce.number().int().nonnegative(),
	leafIndex: z.coerce.number().int().nonnegative().optional(),
	depositCount: z.coerce.number().int().nonnegative(),
});

export type ClaimProofQuery = z.infer<typeof ClaimProofQuerySchema>;
