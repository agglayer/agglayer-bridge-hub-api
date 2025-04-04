import type { Context } from "hono";
import { handleResponse } from "../utils/response_handler";

export const getTransactions = async (c: Context) => {
    const query = c.get("validatedQuery");
    // Logic to fetch transactions based on the query

    return handleResponse(c, "ok");
};
