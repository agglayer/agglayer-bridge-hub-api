import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import {
	TransactionsQuerySchema,
	TransactionsByDepositCountQuerySchema,
	NetworkSchema,
} from "../schemas";
import {
	validateTransactionQueryParams,
	validateTransactionByDepositCountQueryParams,
} from "../middlewares/validate_query_params";
import {
	getTransactions,
	getTransactionByDepositCount,
} from "../controllers/transactions";

const transactionsRoutes = new OpenAPIHono();

// Schema definitions for OpenAPI
const TransactionResponseSchema = z.object({
	success: z.boolean(),
	data: z.array(
		z.object({
			hubUID: z.string(),
			fromAddress: z.string(),
			toAddress: z.string(),
			sourceNetwork: z.number(),
			destinationNetwork: z.number(),
			amount: z.string(),
			status: z.string(),
			lastUpdatedAt: z.number(),
		})
	),
	meta: z.object({
		total: z.number(),
		limit: z.number(),
		nextStartAfterCursor: z.string().optional(),
	}),
});

const ErrorResponseSchema = z.object({
	success: z.boolean(),
	error: z.string(),
});

// GET /transactions route
const getTransactionsRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["transactions"],
	summary: "Get bridge transactions",
	description:
		"Retrieve a paginated list of bridge transactions with optional filtering",
	request: {
		params: NetworkSchema,
		query: TransactionsQuerySchema,
	},
	middleware: [validateTransactionQueryParams],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: TransactionResponseSchema,
				},
			},
			description: "Successful response with bridge transactions",
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

// GET /transactions/:sourceNetworkId/:depositCount route
const getTransactionByDepositCountRoute = createRoute({
	method: "get",
	path: "/{sourceNetworkId}/{depositCount}",
	tags: ["transactions"],
	summary: "Get transaction by deposit count",
	description:
		"Retrieve a specific bridge transaction by source network ID and deposit count",
	request: {
		params: TransactionsByDepositCountQuerySchema,
	},
	middleware: [validateTransactionByDepositCountQueryParams],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: z.object({
						success: z.boolean(),
						data: z.object({
							hubUID: z.string(),
							fromAddress: z.string(),
							toAddress: z.string(),
							sourceNetwork: z.number(),
							destinationNetwork: z.number(),
							amount: z.string(),
							status: z.string(),
							lastUpdatedAt: z.number(),
						}),
					}),
				},
			},
			description: "Successful response with transaction details",
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
			description: "Transaction not found",
		},
	},
});

// Register routes - middleware is already defined in createRoute
transactionsRoutes.openapi(getTransactionsRoute, getTransactions);
transactionsRoutes.openapi(
	getTransactionByDepositCountRoute,
	getTransactionByDepositCount
);

export default transactionsRoutes;
