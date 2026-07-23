import type { Collection, Document } from '@polygonlabs/servercore-mongo';

import { executeMongoOperation } from '@polygonlabs/servercore-mongo';

import type { IHubMetadata } from '../interfaces/metadata.ts';

interface MetadataDocument extends Document, IHubMetadata {
	_id: string;
}

export class MetadataService {
	private readonly collection: Collection<MetadataDocument>;
	private readonly docId: string;

	constructor(collection: Collection<MetadataDocument>, docId: string = 'lastIndexedTransactions') {
		this.collection = collection;
		this.docId = docId;
	}

	public async saveLastIndexedTxs(data: IHubMetadata): Promise<void> {
		await executeMongoOperation(
			this.collection,
			(col) =>
				col.updateOne(
					{ _id: this.docId },
					{
						$set: { ...data },
						$setOnInsert: { _id: this.docId }
					},
					{ upsert: true }
				),
			{
				operationName: 'saveLastIndexedTxs',
				logContext: { ...data } as Record<string, unknown>
			}
		);
	}

	public async getLastIndexedTxs(): Promise<IHubMetadata> {
		const result = await executeMongoOperation(
			this.collection,
			(col) => col.findOne({ _id: this.docId }),
			{
				operationName: 'getLastIndexedTxs'
			}
		);

		return (result ?? {}) as IHubMetadata;
	}
}
