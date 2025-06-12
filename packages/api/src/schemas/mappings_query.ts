import { z } from "zod";
import { networkIdsSchema, PaginationSchema } from "./common";

export const MappingsQuerySchema = z
    .object({
        originTokenAddress: z.string().optional(),
        wrappedTokenAddress: z.string().optional(),
        originNetworkIds: networkIdsSchema.optional(),
        wrappedNetworkIds: networkIdsSchema.optional(),
    })
    .merge(PaginationSchema);

export const MappingsByOriginTokenQuerySchema = z.object({
    originTokenNetwork: z.coerce.number().int().nonnegative(),
    originTokenAddress: z.string().nonempty().optional(),
});

export type MappingsQuery = z.infer<typeof MappingsQuerySchema>;
export type mappingsByOriginTokenQuery = z.infer<
    typeof MappingsByOriginTokenQuerySchema
>;
