import type { Handler } from '@polygonlabs/express/registry';

import { handleError, handleResponse, NotFoundError } from '@polygonlabs/servercore';

import type { Operations } from '../registry.ts';
import type { TokenMetadataService } from '../services/token_metadata.ts';

import { getResponseContext } from '../middlewares/response_context.ts';

export class TokenMetadataController {
	private readonly tokenMetadataService: TokenMetadataService;

	constructor(tokenMetadataService: TokenMetadataService) {
		this.tokenMetadataService = tokenMetadataService;
	}

	getTokenMetadata: Handler<Operations['getTokenMetadata']> = async (req, res) => {
		const { tokenAddress, network } = req.params;

		const token = await this.tokenMetadataService.getTokenMetadata(network, tokenAddress);

		if (!token) {
			handleError(
				getResponseContext(res),
				new NotFoundError('Token metadata not found', 'TokenMetadata', tokenAddress, { network })
			);
			return;
		}

		handleResponse(getResponseContext(res), token);
	};
}
