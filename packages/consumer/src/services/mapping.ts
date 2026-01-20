import {
	executeMongoOperation,
	type Collection,
	type Document,
} from "@agglayer/bridge-hub-commons";
import type { IHubTokenMappings } from "../interfaces/token_mapping";
import { CryptoHasher } from "bun";

interface TokenMappingDocument extends Document, IHubTokenMappings {
	_id: string;
}

export default class TokenMappingsService {
	constructor(
		private readonly collection: Collection<TokenMappingDocument>
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
		const documents = mappings.map((mapping) => ({
			_id: this.generateDocId(
				mapping.originTokenAddress,
				mapping.originTokenNetwork,
				mapping.wrappedTokenNetwork
			),
			...mapping,
		}));

		await executeMongoOperation(
			this.collection,
			async (col) => {
				// Use bulkWrite for efficient upsert operations
				const operations = documents.map((doc) => ({
					replaceOne: {
						filter: { _id: doc._id },
						replacement: doc,
						upsert: true,
					},
				}));
				return col.bulkWrite(operations);
			},
			{
				operationName: "saveTokenMappings",
				logContext: { count: mappings.length },
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
						blockNumber,
					})
					.sort({ blockNumber: -1 })
					.limit(1)
					.toArray(),
			{
				operationName: "getTokenMapping",
				logContext: { transactionHash, blockNumber },
			}
		);
	}
}
