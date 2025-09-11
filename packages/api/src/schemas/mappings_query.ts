import { z } from "zod";
import { networkIdsSchema, NetworkSchema, PaginationSchema } from "./common";

export const MappingsQuerySchema = z
    .object({
        originTokenAddress: z.string().optional(),
        wrappedTokenAddress: z.string().optional(),
        originNetworkIds: networkIdsSchema.optional(),
        wrappedNetworkIds: networkIdsSchema.optional(),
    })
    .merge(PaginationSchema);

export const MappingsByTokenQuerySchema = z
    .object({
        tokenNetwork: z.coerce.number().int().nonnegative(),
        tokenAddress: z.string().nonempty().optional(),
    })
    .merge(NetworkSchema);

export const TokenMetadataQuerySchema = z
    .object({
        tokenAddress: z.string().nonempty().optional(),
    })
    .merge(NetworkSchema);

export type MappingsQuery = z.infer<typeof MappingsQuerySchema>;
export type mappingsByTokenQuery = z.infer<typeof MappingsByTokenQuerySchema>;
export type TokenMetadataQuery = z.infer<typeof TokenMetadataQuerySchema>;
