import { OpenAPIHono } from "@hono/zod-openapi";
import createTransactionRoutes from "./transactions";
import createMappingsRoutes from "./mappings";
import createProofRoutes from "./proof";
import createTokenMetadataRoutes from "./token_metadata";
import { TransactionService } from "../services/transactions";
import { MappingsService } from "../services/mappings";
import { ProofService } from "../services/proof";
import { TokenMetadataService } from "../services/token_metadata";

const createRouter = (
	transactionService: TransactionService,
	mappingsService: MappingsService,
	proofService: ProofService,
	tokenMetadataService: TokenMetadataService
) => {
	const router = new OpenAPIHono();

	router.route("/transactions", createTransactionRoutes(transactionService));
	router.route("/token-mappings", createMappingsRoutes(mappingsService));
	router.route(
		"/claim-proof",
		createProofRoutes(proofService, transactionService)
	);
	router.route(
		"/token-metadata",
		createTokenMetadataRoutes(tokenMetadataService)
	);

	return router;
};

export default createRouter;
