import type { Context } from "hono";
import { TokenMetadataService } from "../services/token_metadata";
import { handleResponse } from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export const getTokenMetadata = async (c: Context) => {
	const { tokenAddress, network } = c.get("validatedParams");

	const token = await TokenMetadataService.getTokenMetadata(
		network,
		tokenAddress
	);

	return handleResponse(getResponseContext(c), token);
};
