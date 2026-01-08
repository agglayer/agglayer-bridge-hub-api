import type {
	IQueryFilterOperationParams,
	IQueryOrderOperationParams,
	IQueryOrFilterParams,
} from "@polygonlabs/servercore";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import { CryptoHasher } from "bun";
import type { IHubTransaction } from "../schemas";

let db: DatabaseClient;
let collectionId: Map<string, string>;

// Order params for db request
const orderParams: IQueryOrderOperationParams[] = [
	{
		field: "hubUID",
		order: "desc",
	},
];

export class TransactionService {
	static initializeTransactionService(
		database: DatabaseClient,
		collectionIdParams: Map<string, string> = new Map([
			["mainnet", "transactions"],
			["testnet", "transactions_testnet"],
			["devnet", "transactions_testnet"],
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

		// Create query params for db request
		const queryParams: IQueryFilterOperationParams[] = [];
		let orderParamsOverride: IQueryOrderOperationParams[] | undefined =
			undefined;
		const orFilters: IQueryOrFilterParams[] = [];

		if (order) {
			orderParamsOverride = [{ field: "hubUID", order: order }];
		}

		if (fromAddress) {
			queryParams.push({
				field: "fromAddress",
				operator: "==",
				value: fromAddress,
			});
		}

		if (sourceNetworkIds) {
			queryParams.push({
				field: "sourceNetwork",
				operator: "in",
				value: sourceNetworkIds,
			});
		}

		if (destinationNetworkIds) {
			queryParams.push({
				field: "destinationNetwork",
				operator: "in",
				value: destinationNetworkIds,
			});
		}

		if (updatedSince) {
			queryParams.push({
				field: "lastUpdatedAt",
				operator: ">=",
				value: updatedSince,
			});

			queryParams.push({
				field: "transactionHash",
				operator: "!=",
				value: "",
			});
		}

		if (status) {
			queryParams.push({
				field: "status",
				operator: "==",
				value: status,
			});
		}

		return await db.getDocuments({
			collectionPath: collectionId.get(network) || "",
			filter: queryParams,
			limit,
			order: orderParamsOverride || orderParams,
			startAfterCursor: startAfter,
			orFilters: orFilters,
			returnTotalDocumentsCount: true,
		});
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
		return (await db.getDocument({
			collectionId: collectionId.get(network) || "",
			docId,
		})) as IHubTransaction;
	}
}
