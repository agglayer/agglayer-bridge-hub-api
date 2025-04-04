import { z } from "zod";
import { networkIdsSchema } from "./common";

export const MappingsQuerySchema = z.object({
    originTokenAddress: z.string().optional(),
    wrappedTokenAddress: z.string().optional(),
    originNetworkIds: networkIdsSchema.optional(),
    wrappedNetworkIds: networkIdsSchema.optional(),
});

export type MappingsQuery = z.infer<typeof MappingsQuerySchema>;
