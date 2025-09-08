import type {
    IQueryFilterOperationParams,
    IQueryOrderOperationParams,
    IQueryOrFilterParams,
} from "@polygonlabs/servercore";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import type { IHubTransaction } from "../interfaces/hub_tx";

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
    ): Promise<IHubTransaction[]> {
        return await db.getDocuments(
            collectionId.get(network) || "",
            queryParams,
            limit,
            orderParams,
            startAfter,
            undefined,
            orQueryParams
        );
    }
}
