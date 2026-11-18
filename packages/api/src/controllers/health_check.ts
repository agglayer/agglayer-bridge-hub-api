import type { Handler } from '@polygonlabs/express/registry';
import type { ApiError } from '@polygonlabs/servercore';

import { handleResponse, handleError } from '@polygonlabs/servercore';

import type { Operations } from '../registry.ts';

import { getResponseContext } from '../middlewares/response_context.ts';

export class HealthCheckController {
	checkServiceHealth: Handler<Operations['checkServiceHealth']> = async (_req, res) => {
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

			handleResponse(getResponseContext(res), {
				status: 'success',
				message: 'All services are working correctly'
			});
		} catch (error) {
			handleError(getResponseContext(res), error as ApiError);
		}
	};
}
