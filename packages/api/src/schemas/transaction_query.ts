import { z } from "zod";
import { networkIdsSchema } from "./common";

export const TransactionsQuerySchema = z.object({
    fromAddress: z.string().optional(),
    sourceNetworkIds: networkIdsSchema.optional(),
    destinationNetworkIds: networkIdsSchema.optional(),
    leafType: z.enum(["ASSET, MESSAGE"]).optional(),
    transactionHash: z.string().optional(),
    depositCount: z.number().int().nonnegative().optional(),
});

export type TransactionsQuery = z.infer<typeof TransactionsQuerySchema>;
