import type { Context } from "hono";
import { handleResponse } from "../utils/response_handler";

export const checkServiceHealth = async (c: Context) => {
    // Logic to check the health of the service

    return handleResponse(c, "ok");
};
