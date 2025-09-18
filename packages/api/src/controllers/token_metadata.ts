import type { Context } from "hono";
import { TokenMetadataService } from "../services/token_metadata";
import {
	handleResponse,
	type IQueryOrFilterParams,
} from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export const getTokenMetadata = async (c: Context) => {
	const { tokenAddress, network } = c.get("validatedParams");

	// Create query params for db request
	const queryParams: IQueryOrFilterParams[] = [];

	if (tokenAddress) {
		queryParams.push({
			or: [
				{
					field: "originTokenAddress",
					operator: "==",
					value: tokenAddress,
				},
				{
					field: "wrappedTokenAddress",
					operator: "==",
					value: tokenAddress,
				},
			],
		});
	}

	const token = await TokenMetadataService.getTokenMetadata(
		network,
		tokenAddress,
		queryParams
	);

	return handleResponse(getResponseContext(c), token);
};
