import type { Context } from "hono";
import type { ClaimProofQuery } from "../schemas";
import { ProofService } from "../services/proof";
import { TransactionService } from "../services/transactions";
import {
	ApiError,
	BadRequestError,
	ExternalDependencyError,
	handleError,
	handleResponse,
	NotFoundError,
} from "@polygonlabs/servercore";
import { getResponseContext } from "../middlewares/response_context";

export const getProof = async (c: Context) => {
	try {
		const validatedQuery: ClaimProofQuery = c.get("validatedQuery");
		const { network } = c.get("validatedParams");

		if (validatedQuery.leafIndex == null) {
			const docId = TransactionService.generateDocId(
				validatedQuery.depositCount,
				validatedQuery.sourceNetworkId
			);

			const transaction =
				await TransactionService.getTransactionByDepositCount(
					network,
					docId
				);

			if (!transaction) {
				throw new NotFoundError(
					"Transaction not found for the given deposit count and source networkId",
					undefined,
					undefined,
					{
						network: network,
						sourceNetwork: validatedQuery.sourceNetworkId,
						depositCount: validatedQuery.depositCount,
					}
				);
			} else if (
				transaction.status === "READY_TO_CLAIM" &&
				transaction.leafIndexForProof
			) {
				validatedQuery.leafIndex = transaction.leafIndexForProof;
			} else if (transaction.status === "CLAIMED") {
				throw new BadRequestError("Transaction already claimed");
			} else {
				throw new BadRequestError("Transaction not ready to claim");
			}
		}

		const proof = await ProofService.getProof(
			network,
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
