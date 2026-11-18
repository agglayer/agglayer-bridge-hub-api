import { z } from 'zod';

import {
	HubTokenMappingsSchema,
	PaginatedResponseSchema,
	ResponseSchema
} from '@agglayer/bridge-hub-types';

import { address, networkIdsSchema, NetworkSchema, PaginationSchema } from './common.ts';

export const MappingsQuerySchema = z
	.object({
		originTokenAddress: address.optional().transform((val) => val?.toLowerCase()),
		wrappedTokenAddress: address.optional().transform((val) => val?.toLowerCase()),
		originNetworkIds: networkIdsSchema.optional(),
		wrappedNetworkIds: networkIdsSchema.optional()
	})
	.merge(PaginationSchema);

export const MappingsByTokenQuerySchema = z
	.object({
		tokenNetwork: z
			.string()
			.max(18, 'Network IDs string must not exceed 18 characters')
			.regex(/^\d+$/, 'chainId must be a non-negative integer')
			.transform((val) => parseInt(val, 10)),
		tokenAddress: address.nonempty().transform((val) => val?.toLowerCase())
	})
	.merge(NetworkSchema);

export const TokenMetadataQuerySchema = z
	.object({
		tokenAddress: address.nonempty().transform((val) => val?.toLowerCase())
	})
	.merge(NetworkSchema);

export const TokenMetadataSchema = z.object({
	name: z.string(),
	symbol: z.string(),
	decimals: z.number(),
	originTokenAddress: address,
	originTokenNetwork: z.number(),
	wrappedTokenAddressV1: address,
	wrappedTokenAddressV2: address
});

export const TokenMetadataResponseSchema = ResponseSchema(TokenMetadataSchema);

export const MappingsResponseSchema = PaginatedResponseSchema(z.array(HubTokenMappingsSchema));

export type MappingsQuery = z.infer<typeof MappingsQuerySchema>;
export type mappingsByTokenQuery = z.infer<typeof MappingsByTokenQuerySchema>;
export type TokenMetadataQuery = z.infer<typeof TokenMetadataQuerySchema>;
export type TokenMetadataResponse = z.infer<typeof TokenMetadataResponseSchema>;
export type TokenMetadata = z.infer<typeof TokenMetadataSchema>;

export type MappingsResponse = z.infer<typeof MappingsResponseSchema>;
