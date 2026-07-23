import type { ClaimProof } from '@agglayer/bridge-hub-types';

import { ApiError, Logger, NotFoundError } from '@polygonlabs/servercore';

import type { Networks } from '../enums/index.ts';

export class ProofService {
	private readonly networkMap: Map<string, Map<number, string>>;

	constructor(networkMapParam: Map<string, Map<number, string>>) {
		this.networkMap = networkMapParam;
	}

	async getProof(
		network: Networks,
		sourceNetwork: number,
		depositCount: number,
		leaf: number
	): Promise<ClaimProof> {
		try {
			const networkURLMap = this.networkMap.get(network);
			if (!networkURLMap) {
				throw new NotFoundError("Network URL isn't supported", undefined, undefined, {
					network: network,
					sourceNetwork,
					depositCount,
					leaf
				});
			}

			const sourceNetworkUrl = networkURLMap.get(sourceNetwork);
			if (!sourceNetworkUrl) {
				throw new NotFoundError("Network URL isn't supported", undefined, undefined, {
					network: network,
					sourceNetwork,
					depositCount,
					leaf
				});
			}

			const proofTargetUrl = `${sourceNetworkUrl}/claim-proof?network_id=${sourceNetwork}&deposit_count=${depositCount}&leaf_index=${leaf}`;
			const txTargetUrl = `${sourceNetworkUrl}/bridges?network_id=${sourceNetwork}&deposit_count=${depositCount}`;

			const [proofResponse, txResponse] = await Promise.all([
				fetch(proofTargetUrl),
				fetch(txTargetUrl)
			]);

			const [proofData, txData] = await Promise.all([proofResponse.json(), txResponse.json()]);

			// NOTE: never put the upstream URL in the error context — servercore's
			// handleError serialises `context` into the response body (`details`),
			// so anything here is visible to the API client. The URLs identify
			// internal Bridge Service endpoints and must stay server-side.
			if (!proofResponse.ok) {
				Logger.warn({
					location: 'ProofService',
					function: 'getProof',
					url: proofTargetUrl,
					status: proofResponse.status
				});
				throw new NotFoundError(proofData?.error || 'Error fetching Proof', undefined, undefined, {
					sourceNetwork,
					depositCount,
					leaf
				});
			}

			if (!txResponse.ok || !txData.bridges || txData.count === 0) {
				Logger.warn({
					location: 'ProofService',
					function: 'getProof',
					url: txTargetUrl,
					status: txResponse.status
				});
				throw new NotFoundError(
					txData?.error || 'Error fetching Transaction for Proof',
					undefined,
					undefined,
					{
						sourceNetwork,
						depositCount
					}
				);
			}

			return {
				...proofData,
				bridge_tx_metadata: txData.bridges[0].metadata
			};
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			// Log the raw error server-side, but never copy error.message into
			// the ApiError: handleError echoes the ApiError's message (and
			// context) to the client, and raw fetch/RPC error messages can embed
			// internal URLs — including credentials — in their text.
			Logger.error({
				location: 'ProofService',
				function: 'getProof',
				error,
				url: this.networkMap.get(network)?.get(sourceNetwork)
			});
			throw new ApiError('Error fetching Proof', {
				context: {
					sourceNetwork,
					depositCount,
					leaf
				}
			});
		}
	}
}
