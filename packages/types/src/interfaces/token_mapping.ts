import { z } from "@hono/zod-openapi";

/**
 * Zod schema for the Hub API's Token Mappings entity
 */
export const HubTokenMappingsSchema = z.object({
	blockNumber: z.number(),
	transactionIndex: z.number(),
	timestamp: z.number(),
	transactionHash: z.string(),
	originTokenNetwork: z.number(),
	originTokenAddress: z.string(),
	wrappedTokenNetwork: z.number(),
	wrappedTokenAddress: z.string(),
	lastUpdatedAt: z.number(),
});

// Export inferred TypeScript type
export type IHubTokenMappings = z.infer<typeof HubTokenMappingsSchema>;
