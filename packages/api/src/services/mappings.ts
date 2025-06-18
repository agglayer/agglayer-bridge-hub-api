import type {
    IQueryFilterOperationParams,
    IQueryOrderOperationParams,
} from "@polygonlabs/servercore";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import type { IHubTransaction } from "../interfaces/hub_tx";

let db: DatabaseClient;
let collectionId: string;

// Order params for db request
const orderParams: IQueryOrderOperationParams[] = [
    {
        field: "timestamp",
        order: "desc",
    },
];

export class MappingsService {
    static initializeTransactionService(
        database: DatabaseClient,
        collectionIdParam: string = "transactions"
    ) {
        if (!db) {
            db = database;
            collectionId = collectionIdParam;
        }
    }

    static async getMappings(
        queryParams: IQueryFilterOperationParams[],
        limit?: number | undefined,
        startAfter?: number | undefined
    ): Promise<IHubTransaction[]> {
        return await db.getDocuments(
            collectionId,
            queryParams,
            limit,
            orderParams,
            startAfter
        );
    }
}
