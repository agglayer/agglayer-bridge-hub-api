import { handleResponse, handleError, ApiError } from "@polygonlabs/servercore";
import type { Context } from "hono";
import { getResponseContext } from "../middlewares/response_context";
import { TransactionService } from "../services/transactions";

export const checkServiceHealth = async (c: Context) => {
	try {
		// const rawConfig = JSON.parse(process.env.CHAIN_CONFIG || "{}");
		// const failedServices: string[] = [];

		// for (const [network, config] of Object.entries(rawConfig)) {
		//     for (const [chainId, baseUrl] of Object.entries(
		//         config as Record<string, string>
		//     )) {
		//         const healthCheckUrl = `${baseUrl.replace(
		//             "/claim-proof",
		//             ""
		//         )}/l1-info-tree-index?network_id=0&deposit_count=0`;

		//         try {
		//             const response = await fetch(healthCheckUrl, {
		//                 method: "GET",
		//                 headers: {
		//                     Accept: "application/json",
		//                 },
		//                 signal: AbortSignal.timeout(5000),
		//             });

		//             if (!response.ok) {
		//                 failedServices.push(
		//                     `${network}:${chainId} (${healthCheckUrl}) - HTTP ${response.status}`
		//                 );
		//             }
		//         } catch (error) {
		//             failedServices.push(
		//                 `${network}:${chainId} (${healthCheckUrl}) - ${
		//                     error instanceof Error
		//                         ? error.message
		//                         : "Unknown error"
		//                 }`
		//             );
		//         }
		//     }
		// }

		// if (failedServices.length > 0) {
		//     throw new ApiError(
		//         `One or more proof services are unhealthy: ${failedServices.join(
		//             ", "
		//         )}`
		//     );
		// }

		return handleResponse(getResponseContext(c), {
			status: "success",
			message: "All services are working correctly",
		});
	} catch (error) {
		return handleError(getResponseContext(c), error as ApiError);
	}
};

export const checkAutoClaimServiceHealth = async (c: Context) => {
	try {
		const networkId = c.get("validatedQuery");
		const { network } = c.get("validatedParams");

		const transactions = await TransactionService.getTransactions(network, [
			{
				field: "destinationNetwork",
				operator: "==",
				value: parseInt(networkId, 10),
			},
			{
				field: "status",
				operator: "==",
				value: "READY_TO_CLAIM",
			},
		]);

		if (transactions && transactions.documents?.length) {
			if (
				transactions.documents[transactions.documents.length - 1]
					.timestamp *
					1000 <
				Date.now() - 60 * 60 * 1000
			) {
				throw new ApiError(
					`Auto-claim service might be unhealthy for Network ${networkId}: Last READY_TO_CLAIM transaction is older than 1 hour`
				);
			}
		}

		return handleResponse(getResponseContext(c), {
			status: "success",
			message: "All services are working correctly",
		});
	} catch (error) {
		return handleError(getResponseContext(c), error as ApiError);
	}
};
