import {
	executeMongoOperation,
	TransactionStatus,
	type Collection,
	type Document,
	type IHubBridgedStatusTransactions,
	type IHubBridgeTransaction,
	type IHubLeafIncludedStatusTransactions,
} from "@agglayer/bridge-hub-commons";
import type { IHubClaimTransaction } from "../interfaces/claim_tx";
import { CryptoHasher } from "bun";

interface TransactionDocument extends Document, IHubBridgeTransaction {
	_id: string;
	claimTransactionHash?: string;
	claimBlockNumber?: number;
	claimTimestamp?: number;
	globalIndex?: string;
	leafIndex?: number;
	leafIndexForProof?: number;
}

export default class TransactionsService {
	constructor(
		private readonly collection: Collection<TransactionDocument>,
		private readonly collectionName: string = "bridge_hub_api_transactions"
	) {}

	private generateDocId(depositCount: number, sourceNetwork: number): string {
		const hasher = new CryptoHasher("sha256");
		hasher.update(`${depositCount}:${sourceNetwork}`);
		return hasher.digest("hex").slice(0, 32);
	}

	public async saveBridges(
		bridgetransactions: IHubBridgeTransaction[]
	): Promise<void> {
		const operations = bridgetransactions.map((tx) => {
			const docId = this.generateDocId(tx.depositCount, tx.sourceNetwork);
			const { status, ...txWithoutStatus } = tx;
			return {
				updateOne: {
					filter: { _id: docId },
					update: {
						$set: txWithoutStatus,
						$setOnInsert: {
							_id: docId,
							status: status,
						},
					},
					upsert: true,
				},
			};
		});

		await executeMongoOperation(
			this.collection,
			(col) => col.bulkWrite(operations),
			{
				operationName: "saveBridges",
				logContext: { count: bridgetransactions.length },
			}
		);
	}

	public async saveClaims(
		claimTransactions: IHubClaimTransaction[]
	): Promise<void> {
		const operations = claimTransactions.map((tx) => {
			const docId = this.generateDocId(tx.depositCount, tx.sourceNetwork);
			return {
				updateOne: {
					filter: { _id: docId },
					update: {
						$set: tx,
						$setOnInsert: {
							_id: docId,
						},
					},
					upsert: true,
				},
			};
		});

		await executeMongoOperation(
			this.collection,
			(col) => col.bulkWrite(operations),
			{
				operationName: "saveClaims",
				logContext: { count: claimTransactions.length },
			}
		);
	}

	public async updateLeafIndex(
		depositCount: number,
		sourceNetwork: number,
		leafIndex: number
	): Promise<void> {
		const docId = this.generateDocId(depositCount, sourceNetwork);

		await executeMongoOperation(
			this.collection,
			(col) =>
				col.updateOne(
					{
						_id: docId,
						status: TransactionStatus.BRIDGED,
					},
					{
						$set: {
							leafIndex,
							status: TransactionStatus.LEAF_INCLUDED,
							lastUpdatedAt: Date.now(),
						},
					}
				),
			{
				operationName: "updateLeafIndex",
				logContext: { depositCount, sourceNetwork, leafIndex },
			}
		);
	}

	public async updateTransactionToReadyToClaim(
		depositCount: number,
		sourceNetwork: number,
		leafIndexForProof: number
	): Promise<void> {
		const docId = this.generateDocId(depositCount, sourceNetwork);

		await executeMongoOperation(
			this.collection,
			(col) =>
				col.updateOne(
					{
						_id: docId,
						status: TransactionStatus.LEAF_INCLUDED,
					},
					{
						$set: {
							leafIndexForProof,
							status: TransactionStatus.READY_TO_CLAIM,
							lastUpdatedAt: Date.now(),
						},
					}
				),
			{
				operationName: "updateTransactionToReadyToClaim",
				logContext: { depositCount, sourceNetwork, leafIndexForProof },
			}
		);
	}

	public async getBridgedTransactions(
		sourceNetwork: number,
		afterId?: string
	): Promise<IHubBridgedStatusTransactions[]> {
		const filter: any = {
			sourceNetwork,
			status: TransactionStatus.BRIDGED,
		};

		// If afterId is provided, use it for cursor-based pagination
		if (afterId) {
			filter.hubUID = { $gt: afterId };
		}

		return await executeMongoOperation(
			this.collection,
			(col) =>
				col
					.find(filter, {
						projection: {
							sourceNetwork: 1,
							depositCount: 1,
							hubUID: 1,
						},
					})
					.sort({ hubUID: 1 })
					.limit(10)
					.toArray(),
			{
				operationName: "getBridgedTransactions",
				logContext: { sourceNetwork, afterId },
			}
		);
	}

	public async getLatestBridgeTransactions(
		sourceNetwork: number
	): Promise<IHubBridgedStatusTransactions[]> {
		return await executeMongoOperation(
			this.collection,
			(col) =>
				col
					.find(
						{ sourceNetwork },
						{
							projection: {
								sourceNetwork: 1,
								depositCount: 1,
								hubUID: 1,
								timestamp: 1,
							},
						}
					)
					.sort({ hubUID: -1 })
					.limit(1)
					.toArray(),
			{
				operationName: "getLatestBridgeTransactions",
				logContext: { sourceNetwork },
			}
		);
	}

	public async getClaim(
		txHash: string
	): Promise<IHubBridgedStatusTransactions[]> {
		return await executeMongoOperation(
			this.collection,
			(col) =>
				col
					.find(
						{ claimTransactionHash: txHash },
						{
							projection: {
								sourceNetwork: 1,
								depositCount: 1,
								hubUID: 1,
							},
						}
					)
					.limit(1)
					.toArray(),
			{
				operationName: "getClaim",
				logContext: { txHash },
			}
		);
	}

	public async getLeafIncludedTransactions(
		destinationNetwork: number,
		afterId?: string
	): Promise<IHubLeafIncludedStatusTransactions[]> {
		const filter: any = {
			destinationNetwork,
			status: TransactionStatus.LEAF_INCLUDED,
		};

		// If afterId is provided, use it for cursor-based pagination
		if (afterId) {
			filter.hubUID = { $gt: afterId };
		}

		const results = await executeMongoOperation(
			this.collection,
			(col) =>
				col
					.find(filter, {
						projection: {
							sourceNetwork: 1,
							depositCount: 1,
							leafIndex: 1,
							hubUID: 1,
						},
					})
					.sort({ hubUID: 1 })
					.limit(10)
					.toArray(),
			{
				operationName: "getLeafIncludedTransactions",
				logContext: { destinationNetwork, afterId },
			}
		);

		// Filter out documents without leafIndex and map to the expected type
		return results
			.filter((doc) => doc.leafIndex !== undefined)
			.map((doc) => ({
				sourceNetwork: doc.sourceNetwork,
				depositCount: doc.depositCount,
				leafIndex: doc.leafIndex as number,
				hubUID: doc.hubUID,
			}));
	}
}
