import type { DatabaseClient } from "bridge-hub-commons/helpers/database";
import type {
    IQueryFilterOperationParams,
    IQueryOrderOperationParams,
} from "bridge-hub-commons/interfaces/database";
import type { IHubTransaction } from "bridge-hub-commons/interfaces/hub_tx";
import { CryptoHasher } from "bun";

let db: DatabaseClient;
let collectionId: string;

// Order params for db request
const orderParams: IQueryOrderOperationParams[] = [
    {
        field: "timestamp",
        order: "desc",
    },
];

export class TransactionService {
    static initializeTransactionService(
        database: DatabaseClient,
        collectionIdParam: string = "transactions"
    ) {
        if (!db) {
            db = database;
            collectionId = collectionIdParam;
        }
    }

    static generateDocId(depositCount: number, sourceNetwork: number): string {
        const hasher = new CryptoHasher("sha256");
        hasher.update(`${depositCount}:${sourceNetwork}`);
        return hasher.digest("hex").slice(0, 32);
    }

    static async getTranasctions(
        queryParams: IQueryFilterOperationParams[],
        limit?: number | undefined,
        startAfterTimestamp?: number | undefined
    ): Promise<IHubTransaction[]> {
        return await db.getDocuments(
            collectionId,
            queryParams,
            limit,
            orderParams,
            startAfterTimestamp
        );
    }

    static async getTransactionByDepositCount(
        docId: string
    ): Promise<IHubTransaction | null> {
        return (await db.getDocument(collectionId, docId)) as IHubTransaction;
    }
}
