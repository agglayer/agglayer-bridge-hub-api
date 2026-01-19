import type { Db, Collection } from "mongodb";
import { CryptoHasher } from "bun";
import {
	executeMongoOperation,
	type Document,
} from "@agglayer/bridge-hub-commons";
import { ApiError } from "@polygonlabs/servercore";
import type { IHubTransaction } from "../schemas";

let db: Db;
let collectionId: Map<string, string>;

interface TransactionDocument extends Document, IHubTransaction {
	_id: string;
}

export class TransactionService {
	static initializeTransactionService(
		database: Db,
		collectionIdParams: Map<string, string> = new Map([
			["mainnet", "bridge_hub_api_transactions"],
			["testnet", "bridge_hub_api_transactions_testnet"],
			["devnet", "bridge_hub_api_transactions_testnet"],
		])
	) {
		if (!db) {
			db = database;
			collectionId = collectionIdParams;
		}
	}

	static generateDocId(depositCount: number, sourceNetwork: number): string {
		const hasher = new CryptoHasher("sha256");
		hasher.update(`${depositCount}:${sourceNetwork}`);
		return hasher.digest("hex").slice(0, 32);
	}

	static async getTransactions({
		network,
		fromAddress,
		sourceNetworkIds,
		destinationNetworkIds,
		updatedSince,
		status,
		order,
		startAfter,
		limit,
	}: {
		network: string;
		fromAddress?: string;
		sourceNetworkIds?: number[];
		destinationNetworkIds?: number[];
		updatedSince?: number;
		status?: string;
		order?: "asc" | "desc";
		startAfter?: string | number;
		limit?: number;
	}): Promise<{
		documents: IHubTransaction[];
		totalDocumentsCount?: number;
	}> {
		if (!db || !collectionId) {
			throw new Error(
				"TransactionService not initialized. Call initializeTransactionService first."
			);
		}

		const collectionName = collectionId.get(network);
		if (!collectionName) {
			throw new ApiError(
				`No collection configured for network: ${network}`,
				{
					context: {
						service: "TransactionService",
						network,
						availableNetworks: Array.from(collectionId.keys()),
					},
				}
			);
		}
		const collection: Collection<TransactionDocument> =
			db.collection(collectionName);

		// Build MongoDB filter
		const filter: any = {};

		if (fromAddress) {
			filter.fromAddress = fromAddress;
		}

		if (sourceNetworkIds && sourceNetworkIds.length > 0) {
			filter.sourceNetwork = { $in: sourceNetworkIds };
		}

		if (destinationNetworkIds && destinationNetworkIds.length > 0) {
			filter.destinationNetwork = { $in: destinationNetworkIds };
		}

		if (updatedSince) {
			filter.lastUpdatedAt = { $gte: updatedSince };
			filter.transactionHash = { $ne: "" };
		}

		if (status) {
			filter.status = status;
		}

		if (startAfter) {
			filter.hubUID = { $lt: startAfter };
		}

		// Build sort order
		const sort: any = {
			hubUID: order === "asc" ? 1 : -1,
		};

		// Execute query
		const documents = await executeMongoOperation(
			collection,
			(col) =>
				col
					.find(filter)
					.sort(sort)
					.limit(limit || 10)
					.toArray(),
			{
				operationName: "getTransactions",
				logContext: { network, filter },
			}
		);

		// Get total count if needed
		let totalDocumentsCount: number | undefined = undefined;
		if (limit) {
			totalDocumentsCount = await executeMongoOperation(
				collection,
				(col) => col.countDocuments(filter),
				{
					operationName: "getTransactionsCount",
					logContext: { network },
				}
			);
		}

		return {
			documents: documents as IHubTransaction[],
			totalDocumentsCount,
		};
	}

	static async getTransactionByDepositCount(
		network: string,
		docId: string
	): Promise<IHubTransaction | null> {
		if (!db || !collectionId) {
			throw new Error(
				"TransactionService not initialized. Call initializeTransactionService first."
			);
		}

		const collectionName = collectionId.get(network);
		if (!collectionName) {
			throw new ApiError(
				`No collection configured for network: ${network}`,
				{
					context: {
						service: "TransactionService",
						network,
						availableNetworks: Array.from(collectionId.keys()),
					},
				}
			);
		}
		const collection: Collection<TransactionDocument> =
			db.collection(collectionName);

		const document = await executeMongoOperation(
			collection,
			(col) => col.findOne({ _id: docId }),
			{
				operationName: "getTransactionByDepositCount",
				logContext: { network, docId },
			}
		);

		return document as IHubTransaction | null;
	}
}
