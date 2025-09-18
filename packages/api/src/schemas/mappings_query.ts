import { z } from "zod";
import { networkIdsSchema, NetworkSchema, PaginationSchema } from "./common";

export const MappingsQuerySchema = z
	.object({
		originTokenAddress: z
			.string()
			.optional()
			.transform((val) => val?.toLowerCase()),
		wrappedTokenAddress: z
			.string()
			.optional()
			.transform((val) => val?.toLowerCase()),
		originNetworkIds: networkIdsSchema.optional(),
		wrappedNetworkIds: networkIdsSchema.optional(),
	})
	.merge(PaginationSchema);

export const MappingsByTokenQuerySchema = z
	.object({
		tokenNetwork: z.coerce.number().int().nonnegative(),
		tokenAddress: z
			.string()
			.nonempty()
			.optional()
			.transform((val) => val?.toLowerCase()),
	})
	.merge(NetworkSchema);

export const TokenMetadataQuerySchema = z
	.object({
		tokenAddress: z
			.string()
			.nonempty()
			.optional()
			.transform((val) => val?.toLowerCase()),
	})
	.merge(NetworkSchema);

export type MappingsQuery = z.infer<typeof MappingsQuerySchema>;
export type mappingsByTokenQuery = z.infer<typeof MappingsByTokenQuerySchema>;
export type TokenMetadataQuery = z.infer<typeof TokenMetadataQuerySchema>;
