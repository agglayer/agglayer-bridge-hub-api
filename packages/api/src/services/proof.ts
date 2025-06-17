import {
    ApiError,
    ExternalDependencyError,
    NotFoundError,
} from "@polygonlabs/servercore";
import type { IProof } from "../interfaces/proof";

let networkMap: Map<number, string>;

export class ProofService {
    static initializeService(networkMapParam: Map<number, string>) {
        if (!networkMap) {
            networkMap = networkMapParam;
        }
    }

    static async getProof(
        sourceNetwork: number,
        depositCount: number,
        leaf: number
    ): Promise<IProof> {
        try {
            const targetUrl = `${networkMap.get(
                sourceNetwork
            )}?network_id=${sourceNetwork}&deposit_count=${depositCount}&leaf_index=${leaf}`;
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
                        url: networkMap.get(sourceNetwork),
                        sourceNetwork,
                        depositCount,
                        leaf,
                    },
                }
            );
        }
    }
}
