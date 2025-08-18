import { z } from "zod";
import { NetworkSchema } from "./common";

export const ClaimProofQuerySchema = z
    .object({
        sourceNetworkId: z.coerce.number().int().nonnegative(),
        leafIndex: z.coerce.number().int().nonnegative(),
        depositCount: z.coerce.number().int().nonnegative(),
    })
    .merge(NetworkSchema);

export type ClaimProofQuery = z.infer<typeof ClaimProofQuerySchema>;
