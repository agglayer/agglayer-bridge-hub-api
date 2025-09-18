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

	static async getMappings(
		network: string,
		queryParams?: IQueryFilterOperationParams[],
		orQueryParams?: IQueryOrFilterParams[],
		limit?: number | undefined,
		startAfter?: number | undefined
	): Promise<{
		documents: IHubTokenMapping[];
		totalDocumentsCount?: number;
	}> {
		return await db.getDocuments({
			collectionPath: collectionId.get(network) || "",
			filter: queryParams,
			limit,
			order: orderParams,
			startAfterCursor: startAfter,
			orFilters: orQueryParams,
			returnTotalDocumentsCount: true,
		});
	}
}
