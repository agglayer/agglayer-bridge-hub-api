import type { Context } from "hono";
import { MappingsService } from "../services/mappings";
import {
    handleResponse,
    type IQueryFilterOperationParams,
    type IQueryOrFilterParams,
} from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";
import { map } from "zod/v4";

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
        undefined,
        query.limit,
        query.startAfter
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

export const getMappingsByToken = async (c: Context) => {
    const query = c.get("validatedQuery");
    const { tokenNetwork, tokenAddress, network } = c.get("validatedParams");

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
    if (tokenNetwork) {
        queryParams.push({
            or: [
                {
                    field: "originTokenNetwork",
                    operator: "==",
                    value: tokenNetwork,
                },
                {
                    field: "wrappedTokenNetwork",
                    operator: "==",
                    value: tokenNetwork,
                },
            ],
        });
    }

    const mappings = await MappingsService.getMappings(
        network,
        undefined,
        queryParams,
        query.limit,
        query.startAfter
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
