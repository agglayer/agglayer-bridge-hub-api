import type { Context } from 'hono';
import type { StatusCode } from 'hono/utils/http-status';

import type { ResponseContext } from '@polygonlabs/servercore';

import { ApiError } from '@polygonlabs/servercore';

export const getResponseContext = (c: Context): ResponseContext => {
	if (!c) throw new ApiError('Context is required');
	const responseContext: ResponseContext = {
		status: (statusCode: number) => {
			c.status(statusCode as StatusCode);
			return responseContext;
		},
		json: (body: any) => c.json(body) // Use Hono's `json` method
	};

	return responseContext;
};
