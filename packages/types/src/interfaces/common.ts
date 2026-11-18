import { z } from 'zod';

export const PaginationResponseSchema = z.object({
	total: z.number(),
	limit: z.number(),
	// @polygonlabs/servercore's handleResponse accepts either a string cursor
	// (transactions' hubUID) or a numeric one (mappings' timestamp) — both
	// must validate here.
	nextStartAfterCursor: z.union([z.string(), z.number()]).optional()
});

// Field is `status`, not `success` — matches @polygonlabs/servercore's
// handleResponse output ({ status: 'success', data, pagination }) exactly.
// Hono's response binding never validated this at runtime, so the previous
// `success: boolean` shape silently never matched reality; the Express
// registry router's response validator does validate at runtime (via
// z.encode), so this must be correct or every endpoint 500s.
export const ResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		status: z.literal('success'),
		data: dataSchema
	});

export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		status: z.literal('success'),
		data: dataSchema,
		pagination: PaginationResponseSchema
	});
