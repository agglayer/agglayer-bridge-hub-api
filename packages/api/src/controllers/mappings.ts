import type { Context } from "hono";
import { handleResponse } from "../utils/response_handler";
import type { IQueryFilterOperationParams } from "bridge-hub-commons/interfaces/database";
import { MappingsService } from "../services/mappings";

export const getMappings = async (c: Context) => {
    const query = c.get("validatedQuery");

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
        queryParams,
        query.limit,
        query.startAfterTimestamp
    );

    return handleResponse(c, mappings);
};

export const getMappingsByOriginToken = async (c: Context) => {
    const query = c.get("validatedQuery");
    const { originTokenNetwork, originTokenAddress } = c.get("validatedParams");

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
        queryParams,
        query.limit,
        query.startAfterTimestamp
    );

    return handleResponse(c, mappings);
};
