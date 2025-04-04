import type { Context } from "hono";
import { handleResponse } from "../utils/response_handler";

export const getMappings = async (c: Context) => {
    const query = c.get("validatedQuery"); // Access validated query params
    // Logic to fetch mappongs based on the query

    return handleResponse(c, "ok");
};
