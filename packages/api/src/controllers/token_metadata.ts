import type { Context } from "hono";
import { TokenMetadataService } from "../services/token_metadata";
import { handleResponse } from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export class TokenMetadataController {
	constructor(private readonly tokenMetadataService: TokenMetadataService) {}

	getTokenMetadata = async (c: Context) => {
		const { tokenAddress, network } = c.get("validatedParams");

		const token = await this.tokenMetadataService.getTokenMetadata(
			network,
			tokenAddress
		);

		return handleResponse(getResponseContext(c), token);
	};
}
