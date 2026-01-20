import type { Db, Collection } from "mongodb";
import {
	executeMongoOperation,
	type Document,
} from "@agglayer/bridge-hub-commons";
import { ApiError } from "@polygonlabs/servercore";
import type { HubTokenMapping } from "../schemas";

let db: Db;
let collectionId: Map<string, string>;

interface MappingDocument extends Document, HubTokenMapping {
	_id: string;
}

export class MappingsService {
	static initializeMappingsService(
		database: Db,
		collectionIdParam: Map<string, string> = new Map([
			["mainnet", "bridge_hub_api_mappings"],
			["testnet", "bridge_hub_api_mappings_testnet"],
			["devnet", "bridge_hub_api_mappings_testnet"],
		])
	) {
		if (db) {
			throw new Error("MappingsService is already initialized");
		}
		db = database;
		collectionId = collectionIdParam;
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
		documents: HubTokenMapping[];
		totalDocumentsCount?: number;
	}> {
		if (!db || !collectionId) {
			throw new Error(
				"MappingsService not initialized. Call initializeMappingsService first."
			);
		}

		const collectionName = collectionId.get(network);
		if (!collectionName) {
			throw new ApiError(
				`No collection configured for network: ${network}`,
				{
					context: {
						service: "MappingsService",
						network,
						availableNetworks: Array.from(collectionId.keys()),
					},
				}
			);
		}
		const collection: Collection<MappingDocument> =
			db.collection(collectionName);

		// Build MongoDB filter
		const filter: any = {};

		if (originTokenAddress) {
			filter.originTokenAddress = originTokenAddress;
		}

		if (wrappedTokenAddress) {
			filter.wrappedTokenAddress = wrappedTokenAddress;
		}

		if (originNetworkIds && originNetworkIds.length > 0) {
			filter.originTokenNetwork = { $in: originNetworkIds };
		}

		if (wrappedNetworkIds && wrappedNetworkIds.length > 0) {
			filter.wrappedTokenNetwork = { $in: wrappedNetworkIds };
		}

		if (startAfter) {
			filter.timestamp = { $lt: startAfter };
		}

		// Build sort order
		const sort: any = {
			timestamp: -1,
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
				operationName: "getMappings",
				logContext: { network, filter },
			}
		);

		return {
			documents: documents as HubTokenMapping[],
			totalDocumentsCount: undefined,
		};
	}

	static async getMappingsByToken(
		tokenAddress: string,
		tokenNetwork: string,
		network: string
	): Promise<{
		documents: HubTokenMapping[];
		totalDocumentsCount?: number;
	}> {
		if (!db || !collectionId) {
			throw new Error(
				"MappingsService not initialized. Call initializeMappingsService first."
			);
		}

		const collectionName = collectionId.get(network);
		if (!collectionName) {
			throw new ApiError(
				`No collection configured for network: ${network}`,
				{
					context: {
						service: "MappingsService",
						network,
						availableNetworks: Array.from(collectionId.keys()),
					},
				}
			);
		}
		const collection: Collection<MappingDocument> =
			db.collection(collectionName);

		// Query for origin tokens
		const originTokenFilter = {
			originTokenAddress: tokenAddress,
			originTokenNetwork: Number(tokenNetwork),
		};

		// Query for wrapped tokens
		const wrappedTokenFilter = {
			wrappedTokenAddress: tokenAddress,
			wrappedTokenNetwork: Number(tokenNetwork),
		};

		const [originTokens, wrappedTokens] = await Promise.all([
			executeMongoOperation(
				collection,
				(col) => col.find(originTokenFilter).toArray(),
				{
					operationName: "getMappingsByToken:originTokens",
					logContext: { network, tokenAddress, tokenNetwork },
				}
			),
			executeMongoOperation(
				collection,
				(col) => col.find(wrappedTokenFilter).toArray(),
				{
					operationName: "getMappingsByToken:wrappedTokens",
					logContext: { network, tokenAddress, tokenNetwork },
				}
			),
		]);

		return {
			documents: [
				...(originTokens as HubTokenMapping[]),
				...(wrappedTokens as HubTokenMapping[]),
			],
			totalDocumentsCount: originTokens.length + wrappedTokens.length,
		};
	}
}
