import { z } from "@hono/zod-openapi";

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
