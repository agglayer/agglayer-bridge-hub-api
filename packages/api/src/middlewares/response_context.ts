import type { ResponseContext } from "@polygonlabs/servercore";
import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";

export const getResponseContext = (c: Context): ResponseContext => {
	const responseContext: ResponseContext = {
		status: (statusCode: number) => {
			c.status(statusCode as StatusCode);
			return responseContext;
		},
		json: (body: any) => c.json(body), // Use Hono's `json` method
	};

	return responseContext;
};
