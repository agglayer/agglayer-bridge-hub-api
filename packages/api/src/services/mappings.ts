import {
	type IQueryFilterOperationParams,
	type IQueryOrderOperationParams,
} from "@polygonlabs/servercore";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import type { IHubTokenMapping } from "../interfaces/hub_mapping";

let db: DatabaseClient;
let collectionId: Map<string, string>;
// let chainConfig: Map<string, Map<number, string>>;
// let bridgeAddress: Map<string, string>;

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
			["devnet", "mappings_testnet"],
		])
		// chainConfigParam: Map<string, Map<number, string>> = new Map([
		// 	["mainnet", new Map([])],
		// 	["testnet", new Map([])],
		// ]),
		// bridgeAddressParam: Map<string, string> = new Map([
		// 	["mainnet", "0x2a3DD3EB832aF982ec71669E178424b10Dca2EDe"],
		// 	["testnet", "0x1348947e282138d8f377b467F7D9c2EB0F335d1f"],
		// ])
	) {
		if (!db) {
			db = database;
			collectionId = collectionIdParam;
			// chainConfig = chainConfigParam;
			// bridgeAddress = bridgeAddressParam;
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
		const originTokenParams: IQueryFilterOperationParams[] = [
			{
				field: "originTokenAddress",
				operator: "==",
				value: tokenAddress,
			},
			{
				field: "originTokenNetwork",
				operator: "==",
				value: Number(tokenNetwork),
			},
		];

		const wrappedTokenParams: IQueryFilterOperationParams[] = [
			{
				field: "wrappedTokenAddress",
				operator: "==",
				value: tokenAddress,
			},
			{
				field: "wrappedTokenNetwork",
				operator: "==",
				value: Number(tokenNetwork),
			},
		];

		const [originTokens, wrappedTokens] = await Promise.all([
			db.getDocuments({
				collectionPath: collectionId.get(network) || "",
				filter: originTokenParams,
				returnTotalDocumentsCount: true,
			}),
			db.getDocuments({
				collectionPath: collectionId.get(network) || "",
				filter: wrappedTokenParams,
				returnTotalDocumentsCount: true,
			}),
		]);

		return {
			documents: [...originTokens.documents, ...wrappedTokens.documents],
			totalDocumentsCount:
				(originTokens.totalDocumentsCount || 0) +
				(wrappedTokens.totalDocumentsCount || 0),
		};
	}
}
