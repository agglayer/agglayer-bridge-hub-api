import {
	executeMongoOperation,
	type Collection,
	type Document,
} from "@agglayer/bridge-hub-commons";
import type { IHubMetadata } from "../interfaces/metadata";

interface MetadataDocument extends Document, IHubMetadata {
	_id: string;
}

export default class MetadataService {
	constructor(
		private readonly collection: Collection<MetadataDocument>,
		private readonly docId: string = "lastIndexedTransactions"
	) {}

	public async saveLastIndexedTxs(data: IHubMetadata): Promise<void> {
		await executeMongoOperation(
			this.collection,
			(col) =>
				col.updateOne(
					{ _id: this.docId },
					{
						$set: { ...data },
						$setOnInsert: { _id: this.docId },
					},
					{ upsert: true }
				),
			{
				operationName: "saveLastIndexedTxs",
				logContext: { ...data } as Record<string, unknown>,
			}
		);
	}

	public async getLastIndexedTxs(): Promise<IHubMetadata> {
		const result = await executeMongoOperation(
			this.collection,
			(col) => col.findOne({ _id: this.docId }),
			{
				operationName: "getLastIndexedTxs",
			}
		);

		return (result ?? {}) as IHubMetadata;
	}
}
