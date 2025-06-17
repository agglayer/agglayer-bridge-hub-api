import type {
    IQueryFilterOperationParams,
    IQueryOrderOperationParams,
} from "@polygonlabs/servercore";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import { CryptoHasher } from "bun";
import type { IHubTransaction } from "../interfaces/hub_tx";

let db: DatabaseClient;
let collectionId: string;

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
        startAfter?: string | undefined
    ): Promise<IHubTransaction[]> {
        return await db.getDocuments(
            collectionId,
            queryParams,
            limit,
            orderParams,
            startAfter
        );
    }

    static async getTransactionByDepositCount(
        docId: string
    ): Promise<IHubTransaction | null> {
        return (await db.getDocument(collectionId, docId)) as IHubTransaction;
    }
}
