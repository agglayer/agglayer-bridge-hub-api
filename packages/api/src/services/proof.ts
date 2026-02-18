import { ApiError, NotFoundError } from "@polygonlabs/servercore";
import { Networks } from "../enums";
import type { ClaimProof } from "@agglayer/bridge-hub-types";

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
				throw new NotFoundError(
					"Network URL isn't supported",
					undefined,
					undefined,
					{
						network: network,
						sourceNetwork,
						depositCount,
						leaf,
					}
				);
			}

			const sourceNetworkUrl = networkURLMap.get(sourceNetwork);
			if (!sourceNetworkUrl) {
				throw new NotFoundError(
					"Network URL isn't supported",
					undefined,
					undefined,
					{
						network: network,
						sourceNetwork,
						depositCount,
						leaf,
					}
				);
			}

			const proofTargetUrl = `${sourceNetworkUrl}/claim-proof?network_id=${sourceNetwork}&deposit_count=${depositCount}&leaf_index=${leaf}`;
			const txTargetUrl = `${sourceNetworkUrl}/bridges?network_id=${sourceNetwork}&deposit_count=${depositCount}`;

			const [proofResponse, txResponse] = await Promise.all([
				fetch(proofTargetUrl),
				fetch(txTargetUrl),
			]);

			const [proofData, txData] = await Promise.all([
				proofResponse.json(),
				txResponse.json(),
			]);

			if (!proofResponse.ok) {
				throw new NotFoundError(
					proofData?.error || "Error fetching Proof",
					undefined,
					undefined,
					{
						url: proofTargetUrl,
						sourceNetwork,
						depositCount,
						leaf,
					}
				);
			}

			if (!txResponse.ok || !txData.bridges || txData.count === 0) {
				throw new NotFoundError(
					txData?.error || "Error fetching Transaction for Proof",
					undefined,
					undefined,
					{
						url: txTargetUrl,
						sourceNetwork,
						depositCount,
					}
				);
			}

			return {
				...proofData,
				bridge_tx_metadata: txData.bridges[0].metadata,
			};
		} catch (error) {
			if (error instanceof NotFoundError) {
				throw error;
			}
			throw new ApiError(
				error instanceof Error ? error.message : "Error fetching Proof",
				{
					context: {
						url: this.networkMap.get(network)?.get(sourceNetwork),
						sourceNetwork,
						depositCount,
						leaf,
					},
				}
			);
		}
	}
}
