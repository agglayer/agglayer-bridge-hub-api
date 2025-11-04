import { z } from "@hono/zod-openapi";

export const ClaimProofQuerySchema = z.object({
	sourceNetworkId: z.coerce.number().int().nonnegative(),
	leafIndex: z.coerce.number().int().nonnegative().optional(),
	depositCount: z.coerce.number().int().nonnegative(),
});

export const ClaimProofResponseSchema = z.object({
	proof_local_exit_root: z.array(z.string()),
	proof_rollup_exit_root: z.array(z.string()),
	l1_info_tree_leaf: z.object({
		block_num: z.number(),
		block_pos: z.number(),
		l1_info_tree_index: z.number(),
		previous_block_hash: z.string(),
		timestamp: z.number(),
		mainnet_exit_root: z.string(),
		rollup_exit_root: z.string(),
		global_exit_root: z.string(),
		hash: z.string(),
	}),
});

export type ClaimProofQuery = z.infer<typeof ClaimProofQuerySchema>;
export type ClaimProofResponse = z.infer<typeof ClaimProofResponseSchema>;
