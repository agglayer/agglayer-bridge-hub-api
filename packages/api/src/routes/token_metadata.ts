import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { validateTokenMetadataQueryParams } from "../middlewares/validate_query_params";
import { getTokenMetadata } from "../controllers/token_metadata";
import {
	TokenMetadataQuerySchema,
	TokenMetadataResponseSchema,
} from "../schemas";

const tokenMetadataRoutes = new OpenAPIHono();

const ErrorResponseSchema = z.object({
	success: z.boolean(),
	error: z.string(),
});

// GET /token-metadata/:tokenAddress route
const getTokenMetadataRoute = createRoute({
	method: "get",
	path: "/{tokenAddress}",
	tags: ["token-metadata"],
	summary: "Get token metadata",
	description:
		"Retrieve metadata for a specific token address including name, symbol, decimals, and other information",
	request: {
		params: TokenMetadataQuerySchema,
	},
	middleware: [validateTokenMetadataQueryParams],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TokenMetadataResponseSchema,
				},
			},
			description: "Successful response with token metadata",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - invalid token address",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Token metadata not found",
		},
	},
});

// Register routes
tokenMetadataRoutes.openapi(getTokenMetadataRoute, getTokenMetadata);

export default tokenMetadataRoutes;
