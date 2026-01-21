import type { Db, Collection } from "mongodb";
import {
	executeMongoOperation,
	type IMappingDocument,
} from "@agglayer/bridge-hub-commons";
import { ApiError } from "@polygonlabs/servercore";
import type { HubTokenMapping } from "../schemas";
import { Networks } from "../enums";

export class MappingsService {
	private readonly db: Db;
	private readonly collectionId: Map<string, string>;

	constructor(
		database: Db,
		collectionIdParam: Map<string, string> = new Map([
			["mainnet", "bridge_hub_api_mappings"],
			["testnet", "bridge_hub_api_mappings_testnet"],
			["devnet", "bridge_hub_api_mappings_testnet"],
		])
	) {
		this.db = database;
		this.collectionId = collectionIdParam;
	}

	async getMappings({
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
		network: Networks;
		limit: number;
		startAfter?: number | undefined;
	}): Promise<{
		documents: HubTokenMapping[];
		totalDocumentsCount?: number;
	}> {
		const collectionName = this.collectionId.get(network);
		if (!collectionName) {
			throw new ApiError(
				`No collection configured for network: ${network}`,
				{
					context: {
						service: "MappingsService",
						network,
						availableNetworks: Array.from(this.collectionId.keys()),
					},
				}
			);
		}
		const collection: Collection<IMappingDocument> =
			this.db.collection(collectionName);

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
			(col) => col.find(filter).sort(sort).limit(limit).toArray(),
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

	async getMappingsByToken(
		tokenAddress: string,
		tokenNetwork: string,
		network: Networks
	): Promise<{
		documents: HubTokenMapping[];
		totalDocumentsCount?: number;
	}> {
		const collectionName = this.collectionId.get(network);
		if (!collectionName) {
			throw new ApiError(
				`No collection configured for network: ${network}`,
				{
					context: {
						service: "MappingsService",
						network,
						availableNetworks: Array.from(this.collectionId.keys()),
					},
				}
			);
		}
		const collection: Collection<IMappingDocument> =
			this.db.collection(collectionName);

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
