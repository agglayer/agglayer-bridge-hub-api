import type { Context } from "hono";
import type { ClaimProofQuery } from "../schemas";
import { ProofService } from "../services/proof";
import {
    ApiError,
    ExternalDependencyError,
    handleError,
    handleResponse,
} from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export const getProof = async (c: Context) => {
    try {
        const validatedQuery: ClaimProofQuery = c.get("validatedQuery");

        const proof = await ProofService.getProof(
            validatedQuery.sourceNetworkId,
            validatedQuery.depositCount,
            validatedQuery.leafIndex
        );

        return handleResponse(getResponseContext(c), proof);
    } catch (error) {
        return handleError(
            getResponseContext(c),
            error as ExternalDependencyError | ApiError
        );
    }
};
