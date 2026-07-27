import type { Handler } from '@polygonlabs/express/registry';

import { handleResponse } from '@polygonlabs/servercore';

import type { Operations } from '../registry.ts';
import type { MappingsService } from '../services/mappings.ts';

import { getResponseContext } from '../middlewares/response_context.ts';

export class MappingsController {
	private readonly mappingsService: MappingsService;

	constructor(mappingsService: MappingsService) {
		this.mappingsService = mappingsService;
	}

	getMappings: Handler<Operations['getMappings']> = async (req, res) => {
		const { network } = req.params;
		const query = req.query;

		const mappings = await this.mappingsService.getMappings({
			network,
			originNetworkIds: query.originNetworkIds,
			originTokenAddress: query.originTokenAddress,
			wrappedNetworkIds: query.wrappedNetworkIds,
			wrappedTokenAddress: query.wrappedTokenAddress,
			limit: query.limit,
			// PaginationSchema.startAfter is a wire-format string (URL query
			// params are always strings); MappingsService.getMappings compares
			// it against the numeric `timestamp` field, so it must be parsed
			// here. Previously silently mismatched (string passed where a
			// number was expected) because the Hono controller's unannotated
			// `Context` never caught it at compile time.
			startAfter: query.startAfter === undefined ? undefined : Number(query.startAfter)
		});

		handleResponse(getResponseContext(res), mappings.documents, {
			total: mappings.totalDocumentsCount || 0,
			limit: query.limit,
			// PaginationSchema/MappingsQuerySchema have no `offset` field — this
			// was previously an always-true `query.offset === undefined` check
			// against a property that never existed, silently allowed by the
			// unannotated Hono `Context` this controller used to read from.
			nextStartAfterCursor: mappings.documents.at(-1)?.timestamp
		});
	};

	getMappingsByToken: Handler<Operations['getMappingsByToken']> = async (req, res) => {
		const { tokenNetwork, tokenAddress, network } = req.params;
		const query = req.query;

		const mappings = await this.mappingsService.getMappingsByToken(
			tokenAddress,
			tokenNetwork,
			network
		);

		handleResponse(getResponseContext(res), mappings.documents, {
			total: mappings.totalDocumentsCount || 0,
			limit: query.limit,
			// PaginationSchema/MappingsQuerySchema have no `offset` field — this
			// was previously an always-true `query.offset === undefined` check
			// against a property that never existed, silently allowed by the
			// unannotated Hono `Context` this controller used to read from.
			nextStartAfterCursor: mappings.documents.at(-1)?.timestamp
		});
	};
}
