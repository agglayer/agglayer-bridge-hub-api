import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { validateClaimProofQueryParams } from "../middlewares/validate_query_params";
import { getProof } from "../controllers/proof";
import {
	ClaimProofQuerySchema,
	ClaimProofResponseSchema,
	NetworkSchema,
} from "../schemas";

const proofRoutes = new OpenAPIHono();

const getClaimProofRoute = createRoute({
	method: "get",
	path: "/",
	tags: ["proof"],
	summary: "Get claim proof",
	description: "Retrieve the claim proof for a specific transaction",
	request: {
		params: NetworkSchema,
		query: ClaimProofQuerySchema,
	},
	middleware: [validateClaimProofQueryParams],
	responses: {
		200: {
			content: {
				"application/json": {
					schema: ClaimProofResponseSchema,
				},
			},
			description: "Successful response with claim proof",
		},
		400: {
			description: "Bad request - invalid parameters",
		},
		404: {
			description: "Claim proof not found",
		},
	},
});

proofRoutes.openapi(getClaimProofRoute, getProof);

export default proofRoutes;
