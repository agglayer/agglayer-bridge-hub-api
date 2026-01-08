import { z } from "@hono/zod-openapi";
import { Networks } from "../enums";

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
	limit: z.coerce.number().int().nonnegative().max(50).default(20),
	startAfter: z.coerce
		.string()
		.max(40, "startAfter string must not exceed 40 characters")
		.optional(),
});

export const NetworkSchema = z.object({
	network: z.enum(Networks),
});

export const address = z.string().regex(/^0x[a-fA-F0-9]{40}$/, {
	message: "Invalid address",
});

export const networkIdSchema = z
	.string()
	.max(18, "Network ID string must not exceed 18 characters")
	.transform((val) => val.split(",").map((v) => v.trim()))
	.refine((arr) => arr.every((v) => /^\d+$/.test(v)), {
		message: "networkIds must be non-negative integers",
	})
	.transform((arr) => arr.map((v) => Number(v)));

export const PaginationResponseSchema = z.object({
	total: z.number(),
	limit: z.number(),
	nextStartAfterCursor: z.string().optional(),
});

export const ResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		success: z.boolean(),
		data: dataSchema,
	});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
	dataSchema: T
) =>
	z.object({
		success: z.boolean(),
		data: dataSchema,
		pagination: PaginationResponseSchema,
	});
