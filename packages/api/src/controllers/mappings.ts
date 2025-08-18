import type { Context } from "hono";
import { MappingsService } from "../services/mappings";
import {
    handleResponse,
    type IQueryFilterOperationParams,
} from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export const getMappings = async (c: Context) => {
    const query = c.get("validatedQuery");
    const { network } = c.get("validatedParams");

    // Create query params for db request
    const queryParams: IQueryFilterOperationParams[] = [];

    if (query.originTokenAddress) {
        queryParams.push({
            field: "originTokenAddress",
            operator: "==",
            value: query.originTokenAddress,
        });
    }
    if (query.wrappedTokenAddress) {
        queryParams.push({
            field: "wrappedTokenAddress",
            operator: "==",
            value: query.wrappedTokenAddress,
        });
    }
    if (query.originNetworkIds) {
        queryParams.push({
            field: "originTokenNetwork",
            operator: "in",
            value: query.originNetworkIds,
        });
    }
    if (query.wrappedNetworkIds) {
        queryParams.push({
            field: "wrappedTokenNetwork",
            operator: "in",
            value: query.wrappedNetworkIds,
        });
    }

    const mappings = await MappingsService.getMappings(
        network,
        queryParams,
        query.limit,
        query.startAfter
    );

    return handleResponse(getResponseContext(c), mappings);
};

export const getMappingsByOriginToken = async (c: Context) => {
    const query = c.get("validatedQuery");
    const { originTokenNetwork, originTokenAddress, network } =
        c.get("validatedParams");

    // Create query params for db request
    const queryParams: IQueryFilterOperationParams[] = [];

    if (query.originTokenAddress) {
        queryParams.push({
            field: "originTokenAddress",
            operator: "==",
            value: originTokenAddress,
        });
    }
    if (query.originNetworkIds) {
        queryParams.push({
            field: "originTokenNetwork",
            operator: "in",
            value: originTokenNetwork,
        });
    }

    const mappings = await MappingsService.getMappings(
        network,
        queryParams,
        query.limit,
        query.startAfter
    );

    return handleResponse(getResponseContext(c), mappings);
};
