import { z } from "zod";
import {
	address,
	networkIdsSchema,
	NetworkSchema,
	PaginationSchema,
} from "./common";

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

export type MappingsQuery = z.infer<typeof MappingsQuerySchema>;
export type mappingsByTokenQuery = z.infer<typeof MappingsByTokenQuerySchema>;
export type TokenMetadataQuery = z.infer<typeof TokenMetadataQuerySchema>;
