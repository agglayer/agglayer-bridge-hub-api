import type {
	IQueryFilterOperationParams,
	IQueryOrderOperationParams,
	IQueryOrFilterParams,
} from "@polygonlabs/servercore";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import type { IHubTokenMapping } from "../interfaces/hub_mapping";

let db: DatabaseClient;
let collectionId: Map<string, string>;

// Order params for db request
const orderParams: IQueryOrderOperationParams[] = [
	{
		field: "timestamp",
		order: "desc",
	},
];

export class MappingsService {
	static initializeMappingsService(
		database: DatabaseClient,
		collectionIdParam: Map<string, string> = new Map([
			["mainnet", "mappings"],
			["testnet", "mappings_testnet"],
		])
	) {
		if (!db) {
			db = database;
			collectionId = collectionIdParam;
		}
	}

	static async getMappings({
		originTokenAddress,
		wrappedTokenAddress,
		originNetworkIds,
		wrappedNetworkIds,
		network,
		limit,
		startAfter,
	}: {
		originTokenAddress?: string;
		wrappedTokenAddress?: string;
		originNetworkIds?: number[];
		wrappedNetworkIds?: number[];
		network: string;
		limit?: number | undefined;
		startAfter?: number | undefined;
	}): Promise<{
		documents: IHubTokenMapping[];
		totalDocumentsCount?: number;
	}> {
		if (!db || !collectionId) {
			throw new Error(
				"MappingsService not initialized. Call initializeMappingsService first."
			);
		}
		const queryParams: IQueryFilterOperationParams[] = [];

		if (originTokenAddress) {
			queryParams.push({
				field: "originTokenAddress",
				operator: "==",
				value: originTokenAddress,
			});
		}
		if (wrappedTokenAddress) {
			queryParams.push({
				field: "wrappedTokenAddress",
				operator: "==",
				value: wrappedTokenAddress,
			});
		}
		if (originNetworkIds && originNetworkIds.length > 0) {
			queryParams.push({
				field: "originTokenNetwork",
				operator: "in",
				value: originNetworkIds,
			});
		}
		if (wrappedNetworkIds && wrappedNetworkIds.length > 0) {
			queryParams.push({
				field: "wrappedTokenNetwork",
				operator: "in",
				value: wrappedNetworkIds,
			});
		}

		// Fetch documents from db
		return await db.getDocuments({
			collectionPath: collectionId.get(network) || "",
			filter: queryParams,
			limit,
			order: orderParams,
			startAfterCursor: startAfter,
		});
	}

	static async getMappingsByToken(
		tokenAddress: string,
		tokenNetwork: string,
		network: string
	): Promise<{
		documents: IHubTokenMapping[];
		totalDocumentsCount?: number;
	}> {
		if (!db || !collectionId) {
			throw new Error(
				"MappingsService not initialized. Call initializeMappingsService first."
			);
		}

		// Create query params for db request
		const queryParams: IQueryOrFilterParams[] = [];

		if (tokenAddress) {
			queryParams.push({
				or: [
					{
						field: "originTokenAddress",
						operator: "==",
						value: tokenAddress,
					},
					{
						field: "wrappedTokenAddress",
						operator: "==",
						value: tokenAddress,
					},
				],
			});
		}
		if (tokenNetwork) {
			queryParams.push({
				or: [
					{
						field: "originTokenNetwork",
						operator: "==",
						value: tokenNetwork,
					},
					{
						field: "wrappedTokenNetwork",
						operator: "==",
						value: tokenNetwork,
					},
				],
			});
		}
		return await db.getDocuments({
			collectionPath: collectionId.get(network) || "",
			orFilters: queryParams,
		});
	}
}
