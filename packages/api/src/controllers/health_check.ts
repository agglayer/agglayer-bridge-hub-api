import { handleResponse } from "@polygonlabs/servercore";
import type { Context } from "hono";
import { getResponseContext } from "../middlewares/response_context";

export const checkServiceHealth = async (c: Context) => {
    // Logic to check the health of the service

    return handleResponse(getResponseContext(c), "ok");
};
