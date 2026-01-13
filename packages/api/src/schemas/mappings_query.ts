import { z } from "@hono/zod-openapi";
import {
	address,
	networkIdsSchema,
	NetworkSchema,
	PaginatedResponseSchema,
	PaginationSchema,
	ResponseSchema,
} from "./common";
import {
	HubTokenMappingsSchema,
	type IHubTokenMappings,
} from "@agglayer/bridge-hub-commons";

export const MappingsQuerySchema = z
	.object({
		originTokenAddress: address
			.optional()
			.transform((val) => val?.toLowerCase()),
		wrappedTokenAddress: address
			.optional()
			.transform((val) => val?.toLowerCase()),
		originNetworkIds: networkIdsSchema.optional(),
		wrappedNetworkIds: networkIdsSchema.optional(),
	})
	.merge(PaginationSchema);

export const MappingsByTokenQuerySchema = z
	.object({
		tokenNetwork: z
			.string()
			.max(18, "Network IDs string must not exceed 18 characters")
			.regex(/^\d+$/, "chainId must be a non-negative integer")
			.transform((val) => parseInt(val, 10)),
		tokenAddress: address.nonempty().transform((val) => val?.toLowerCase()),
	})
	.merge(NetworkSchema);

export const TokenMetadataQuerySchema = z
	.object({
		tokenAddress: address.nonempty().transform((val) => val?.toLowerCase()),
	})
	.merge(NetworkSchema);

export const TokenMetadataSchema = z.object({
	name: z.string(),
	symbol: z.string(),
	decimals: z.number(),
	originTokenAddress: address,
	originTokenNetwork: z.number(),
	wrappedTokenAddressV1: address,
	wrappedTokenAddressV2: address,
});

export const TokenMetadataResponseSchema = ResponseSchema(TokenMetadataSchema);

// Re-export schema from shared types package
export const HubTokenMappingSchema = HubTokenMappingsSchema;

export const MappingsResponseSchema = PaginatedResponseSchema(
	z.array(HubTokenMappingSchema)
);

export type MappingsQuery = z.infer<typeof MappingsQuerySchema>;
export type mappingsByTokenQuery = z.infer<typeof MappingsByTokenQuerySchema>;
export type TokenMetadataQuery = z.infer<typeof TokenMetadataQuerySchema>;
export type TokenMetadataResponse = z.infer<typeof TokenMetadataResponseSchema>;
export type TokenMetadata = z.infer<typeof TokenMetadataSchema>;

// Re-export type from shared package with alias for backwards compatibility
export type { IHubTokenMappings as HubTokenMapping };

export type MappingsResponse = z.infer<typeof MappingsResponseSchema>;
