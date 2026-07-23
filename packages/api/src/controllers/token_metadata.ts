import type { Context } from 'hono';

import { handleResponse } from '@polygonlabs/servercore';

import type { TokenMetadataService } from '../services/token_metadata.ts';

import { getResponseContext } from '../middlewares/response_context.ts';

export class TokenMetadataController {
	private readonly tokenMetadataService: TokenMetadataService;

	constructor(tokenMetadataService: TokenMetadataService) {
		this.tokenMetadataService = tokenMetadataService;
	}

	getTokenMetadata = async (c: Context) => {
		const { tokenAddress, network } = c.get('validatedParams');

		const token = await this.tokenMetadataService.getTokenMetadata(network, tokenAddress);

		return handleResponse(getResponseContext(c), token);
	};
}
