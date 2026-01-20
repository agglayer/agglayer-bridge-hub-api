import type { Context } from "hono";
import { MappingsService } from "../services/mappings";
import { handleResponse } from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export class MappingsController {
	constructor(private readonly mappingsService: MappingsService) {}

	getMappings = async (c: Context) => {
		const query = c.get("validatedQuery");
		const { network } = c.get("validatedParams");

		const mappings = await this.mappingsService.getMappings({
			network,
			originNetworkIds: query.originNetworkIds,
			originTokenAddress: query.originTokenAddress,
			wrappedNetworkIds: query.wrappedNetworkIds,
			wrappedTokenAddress: query.wrappedTokenAddress,
			limit: query.limit,
			startAfter: query.startAfter,
		});

		return handleResponse(getResponseContext(c), mappings.documents, {
			total: mappings.totalDocumentsCount || 0,
			limit: query.limit,
			nextStartAfterCursor:
				query.offset === undefined
					? mappings.documents.at(-1)?.timestamp
					: undefined,
		});
	};

	getMappingsByToken = async (c: Context) => {
		const query = c.get("validatedQuery");
		const { tokenNetwork, tokenAddress, network } =
			c.get("validatedParams");

		const mappings = await this.mappingsService.getMappingsByToken(
			tokenAddress,
			tokenNetwork,
			network
		);

		return handleResponse(getResponseContext(c), mappings.documents, {
			total: mappings.totalDocumentsCount || 0,
			limit: query.limit,
			nextStartAfterCursor:
				query.offset === undefined
					? mappings.documents.at(-1)?.timestamp
					: undefined,
		});
	};
}
