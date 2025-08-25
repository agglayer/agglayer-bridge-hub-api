import { z } from "zod";

export const ClaimProofQuerySchema = z.object({
    sourceNetworkId: z.coerce.number().int().nonnegative(),
    leafIndex: z.coerce.number().int().nonnegative(),
    depositCount: z.coerce.number().int().nonnegative(),
});

export type ClaimProofQuery = z.infer<typeof ClaimProofQuerySchema>;
