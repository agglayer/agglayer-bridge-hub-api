import { ApiError, NotFoundError } from "@polygonlabs/servercore";
import { Networks } from "../enums";
import type { ClaimProofResponse } from "@agglayer/bridge-hub-commons";

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
	): Promise<ClaimProofResponse> {
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

			const targetUrl = `${sourceNetworkUrl}?network_id=${sourceNetwork}&deposit_count=${depositCount}&leaf_index=${leaf}`;
			const response = await fetch(targetUrl);
			const data = await response.json();
			if (!response.ok) {
				throw new NotFoundError(
					data?.error || "Error fetching Proof",
					undefined,
					undefined,
					{
						url: targetUrl,
						sourceNetwork,
						depositCount,
						leaf,
					}
				);
			}
			return data;
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
