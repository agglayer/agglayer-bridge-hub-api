import { Hono } from "hono";
import { validateTransactionQueryParams } from "../middlewares/validate_query_params";
import { getTransactions } from "../controllers/transactions";

const transactionsRoutes = new Hono();

transactionsRoutes.get("/", validateTransactionQueryParams, getTransactions);

export default transactionsRoutes;
