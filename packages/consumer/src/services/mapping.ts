import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import type { IHubTokenMappings } from "../interfaces/token_mapping";
import { CryptoHasher } from "bun";

export default class TokenMappingsService {
	constructor(
		private readonly database: DatabaseClient,
		private readonly collectionId: string = "bridge_hub_api_tokenMappings"
	) {}

	private generateDocId(
		originTokenAddress: string,
		originTokenNetwork: number,
		wrappedTokenNetwork: number
	): string {
		const hasher = new CryptoHasher("sha256");
		hasher.update(
			`${originTokenNetwork}:${originTokenAddress}:${wrappedTokenNetwork}`
		);
		return hasher.digest("hex").slice(0, 32);
	}

	public async saveTokenMappings(
		mappings: IHubTokenMappings[]
	): Promise<void> {
		const docIds: string[] = [];
		mappings.forEach((mapping) => {
			const docId = this.generateDocId(
				mapping.originTokenAddress,
				mapping.originTokenNetwork,
				mapping.wrappedTokenNetwork
			);
			docIds.push(docId);
		});

		this.database.addDocuments({
			collectionPaths: this.collectionId,
			docDatas: mappings,
			docIds: docIds,
		});
	}
}
