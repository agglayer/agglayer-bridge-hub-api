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

export class ProofController {
	constructor(
		private readonly proofService: ProofService,
		private readonly transactionService: TransactionService
	) {}

	getProof = async (c: Context) => {
		try {
			const validatedQuery: ClaimProofQuery = c.get("validatedQuery");
			const { network } = c.get("validatedParams");

			if (validatedQuery.leafIndex == null) {
				const docId = this.transactionService.generateDocId(
					validatedQuery.depositCount,
					validatedQuery.sourceNetworkId
				);

				const transaction =
					await this.transactionService.getTransactionByDepositCount(
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

			// By here leafIndex is either supplied in the query or back-filled
			// from a READY_TO_CLAIM transaction above; guard to narrow the
			// optional type for getProof (which requires a number) rather than
			// asserting non-null.
			if (validatedQuery.leafIndex == null) {
				throw new BadRequestError("Transaction not ready to claim");
			}

			const proof = await this.proofService.getProof(
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
}
