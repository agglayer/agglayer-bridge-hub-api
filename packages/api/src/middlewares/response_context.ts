import type { Response } from 'express';

import type { ResponseContext } from '@polygonlabs/servercore';

import { ApiError } from '@polygonlabs/servercore';

export const getResponseContext = (res: Response): ResponseContext => {
	if (!res) throw new ApiError('Response is required');
	const responseContext: ResponseContext = {
		status: (statusCode: number) => {
			res.status(statusCode);
			return responseContext;
		},
		json: (body: any) => res.json(body)
	};

	return responseContext;
};
