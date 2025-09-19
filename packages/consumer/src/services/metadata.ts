import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import type { IHubMetadata } from "../interfaces/metadata";

export default class MetadataService {
	constructor(
		private readonly database: DatabaseClient,
		private readonly collectionId: string = "bridge_hub_api_metadata",
		private readonly docId: string = "lastIndexedTransactions"
	) {}

	public async saveLastIndexedTxs(data: IHubMetadata): Promise<void> {
		await this.database.updateDocuments({
			collectionPaths: [this.collectionId],
			docDatas: [data],
			docIds: [this.docId],
		});
	}

	public async getLastIndexedTxs(): Promise<IHubMetadata> {
		const data = await this.database.getDocument({
			collectionId: this.collectionId,
			docId: this.docId,
		});
		return data as IHubMetadata;
	}
}
