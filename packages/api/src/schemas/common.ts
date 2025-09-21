import { z } from "@hono/zod-openapi";

export const networkIdsSchema = z
	.string()
	.max(18, "Network IDs string must not exceed 18 characters")
	.refine(
		(val) => {
			// Check for empty string
			if (val.trim() === "") return false;

			// Split by comma and validate each part
			const parts = val.split(",");
			return parts.every((part) => {
				const trimmed = part.trim();
				// Each part must be non-empty and match digit-only regex
				return trimmed !== "" && /^\d+$/.test(trimmed);
			});
		},
		{
			message:
				"Network IDs must be comma-separated non-negative integers (no empty values, trailing commas, or non-digits)",
		}
	)
	.transform((val) => val.split(",").map((v) => parseInt(v.trim(), 10)));

export const PaginationSchema = z.object({
	limit: z.coerce.number().int().nonnegative().default(20),
	startAfter: z.coerce
		.string()
		.max(18, "Network IDs string must not exceed 18 characters")
		.optional(),
});

export const NetworkSchema = z.object({
	network: z.enum(["mainnet", "testnet"]),
});

export const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
	message: "Invalid address",
});
