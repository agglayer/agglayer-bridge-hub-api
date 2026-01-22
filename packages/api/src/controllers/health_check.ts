import { handleResponse, handleError, ApiError } from "@polygonlabs/servercore";
import type { Context } from "hono";
import { getResponseContext } from "../middlewares/response_context";
import { HealthCheckService } from "../services/health_check";

export class HealthCheckController {
	constructor(private readonly healthCheckService: HealthCheckService) {}

	checkServiceHealth = async (c: Context) => {
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

	checkAutoClaimServiceHealth = async (c: Context) => {
		try {
			const { networkId, sourceNetworkIds } = c.get("validatedQuery");
			const { network } = c.get("validatedParams");

			await this.healthCheckService.checkForAutoClaim(
				network,
				networkId,
				sourceNetworkIds
			);

			return handleResponse(getResponseContext(c), {
				status: "success",
				message: "All services are working correctly",
			});
		} catch (error) {
			return handleError(getResponseContext(c), error as ApiError);
		}
	};
}
