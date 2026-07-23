import { createHash } from 'node:crypto';

import type { IHubTokenMappings, IMappingDocument } from '@agglayer/bridge-hub-types';
import type { Collection } from '@polygonlabs/servercore-mongo';

import { executeMongoOperation } from '@polygonlabs/servercore-mongo';

export class TokenMappingsService {
	private readonly collection: Collection<IMappingDocument>;

	constructor(collection: Collection<IMappingDocument>) {
		this.collection = collection;
	}

	private generateDocId(
		originTokenAddress: string,
		originTokenNetwork: number,
		wrappedTokenNetwork: number
	): string {
		return createHash('sha256')
			.update(`${originTokenNetwork}:${originTokenAddress}:${wrappedTokenNetwork}`)
			.digest('hex')
			.slice(0, 32);
	}

	public async saveTokenMappings(mappings: IHubTokenMappings[]): Promise<void> {
		const documents = mappings.map((mapping) => ({
			_id: this.generateDocId(
				mapping.originTokenAddress,
				mapping.originTokenNetwork,
				mapping.wrappedTokenNetwork
			),
			...mapping
		}));

		await executeMongoOperation(
			this.collection,
			async (col) => {
				// Use bulkWrite for efficient upsert operations
				const operations = documents.map((doc) => ({
					replaceOne: {
						filter: { _id: doc._id },
						replacement: doc,
						upsert: true
					}
				}));
				return col.bulkWrite(operations);
			},
			{
				operationName: 'saveTokenMappings',
				logContext: { count: mappings.length }
			}
		);
	}

	public async getTokenMapping(
		transactionHash: string,
		blockNumber: number
	): Promise<IHubTokenMappings[]> {
		return await executeMongoOperation(
			this.collection,
			(col) =>
				col
					.find({
						transactionHash,
						blockNumber
					})
					.sort({ blockNumber: -1 })
					.limit(1)
					.toArray(),
			{
				operationName: 'getTokenMapping',
				logContext: { transactionHash, blockNumber }
			}
		);
	}
}
