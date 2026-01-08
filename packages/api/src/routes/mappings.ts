import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	validateMappingsByTokenQueryParams,
	validateMappingsQueryParams,
} from "../middlewares/validate_query_params";
import { getMappings, getMappingsByToken } from "../controllers/mappings";
import {
	MappingsByTokenQuerySchema,
	MappingsQuerySchema,
	MappingsResponseSchema,
} from "../schemas";
import { NetworkSchema, PaginationSchema } from "../schemas/common";

const mappingsRoutes = new OpenAPIHono();

const ErrorResponseSchema = z.object({
	success: z.boolean(),
	error: z.string(),
});

// GET /token-mappings route
const getMappingsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["mappings"],
	summary: "Get token mappings",
	description: "Retrieve a paginated list of token mappings between networks",
	request: {
		query: MappingsQuerySchema,
		params: NetworkSchema,
	},
	middleware: [validateMappingsQueryParams],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: MappingsResponseSchema,
				},
			},
			description: "Successful response with token mappings",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - invalid parameters",
		},
	},
});

// GET /token-mappings/:tokenNetwork/:tokenAddress route
const getMappingsByTokenRoute = createRoute({
	method: "get",
	path: "/{tokenNetwork}/{tokenAddress}",
	tags: ["mappings"],
	summary: "Get mappings by token",
	description:
		"Retrieve token mappings for a specific token address and network",
	request: {
		params: MappingsByTokenQuerySchema,
		query: PaginationSchema,
	},
	middleware: [validateMappingsByTokenQueryParams],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: MappingsResponseSchema,
				},
			},
			description: "Successful response with token mappings",
		},
		400: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Bad request - invalid parameters",
		},
		404: {
			content: {
				"application/json": {
					schema: ErrorResponseSchema,
				},
			},
			description: "Token mappings not found",
		},
	},
});

// Register routes
mappingsRoutes.openapi(getMappingsRoute, getMappings);
mappingsRoutes.openapi(getMappingsByTokenRoute, getMappingsByToken);

export default mappingsRoutes;
