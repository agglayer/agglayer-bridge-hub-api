import { Hono } from "hono";
import {
	validateTransactionQueryParams,
	validateTransactionByDepositCountQueryParams,
} from "../middlewares/validate_query_params";
import {
	getTransactions,
	getTransactionByDepositCount,
} from "../controllers/transactions";

const transactionsRoutes = new Hono();

transactionsRoutes.get("/", validateTransactionQueryParams, getTransactions);
transactionsRoutes.get(
	"/:sourceNetworkId/:depositCount",
	validateTransactionByDepositCountQueryParams,
	getTransactionByDepositCount
);

export default transactionsRoutes;
