import type { Db, Collection } from "mongodb";
import { CryptoHasher } from "bun";
import {
	executeMongoOperation,
	type Document,
} from "@agglayer/bridge-hub-commons";
import { ApiError } from "@polygonlabs/servercore";
import type { IHubTransaction } from "../schemas";
import { Networks } from "../enums";

interface TransactionDocument extends Document, IHubTransaction {
	_id: string;
}

export class TransactionService {
	private readonly db: Db;
	private readonly collectionId: Map<string, string>;

	constructor(
		database: Db,
		collectionIdParams: Map<string, string> = new Map([
			["mainnet", "bridge_hub_api_transactions"],
			["testnet", "bridge_hub_api_transactions_testnet"],
			["devnet", "bridge_hub_api_transactions_testnet"],
		])
	) {
		this.db = database;
		this.collectionId = collectionIdParams;
	}

	generateDocId(depositCount: number, sourceNetwork: number): string {
		const hasher = new CryptoHasher("sha256");
		hasher.update(`${depositCount}:${sourceNetwork}`);
		return hasher.digest("hex").slice(0, 32);
	}

	async getTransactions({
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
		network: Networks;
		fromAddress?: string;
		sourceNetworkIds?: number[];
		destinationNetworkIds?: number[];
		updatedSince?: number;
		status?: string;
		order?: "asc" | "desc";
		startAfter?: string | number;
		limit: number;
	}): Promise<{
		documents: IHubTransaction[];
		totalDocumentsCount?: number;
	}> {
		const collectionName = this.collectionId.get(network);
		if (!collectionName) {
			throw new ApiError(
				`No collection configured for network: ${network}`,
				{
					context: {
						service: "TransactionService",
						network,
						availableNetworks: Array.from(this.collectionId.keys()),
					},
				}
			);
		}
		const collection: Collection<TransactionDocument> =
			this.db.collection(collectionName);

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
			(col) => col.find(filter).sort(sort).limit(limit).toArray(),
			{
				operationName: "getTransactions",
				logContext: { network, filter },
			}
		);

		// Get total count if needed
		const totalDocumentsCount = await executeMongoOperation(
			collection,
			(col) => col.countDocuments(filter),
			{
				operationName: "getTransactionsCount",
				logContext: { network },
			}
		);

		return {
			documents: documents as IHubTransaction[],
			totalDocumentsCount,
		};
	}

	async getTransactionByDepositCount(
		network: Networks,
		docId: string
	): Promise<IHubTransaction | null> {
		const collectionName = this.collectionId.get(network);
		if (!collectionName) {
			throw new ApiError(
				`No collection configured for network: ${network}`,
				{
					context: {
						service: "TransactionService",
						network,
						availableNetworks: Array.from(this.collectionId.keys()),
					},
				}
			);
		}
		const collection: Collection<TransactionDocument> =
			this.db.collection(collectionName);

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
