import type {
    IQueryFilterOperationParams,
    IQueryOrderOperationParams,
} from "@polygonlabs/servercore";
import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import { CryptoHasher } from "bun";
import type { IHubTransaction } from "../interfaces/hub_tx";

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

    static async getTransactions(
        network: string,
        queryParams: IQueryFilterOperationParams[],
        limit?: number | undefined,
        startAfter?: string | undefined,
        orderParamsOverride?: IQueryOrderOperationParams[]
    ): Promise<{ documents: IHubTransaction[]; totalDocumentsCount?: number }> {
        return await db.getDocuments({
            collectionPath: collectionId.get(network) || "",
            filter: queryParams,
            limit,
            order: orderParamsOverride || orderParams,
            startAfterCursor: startAfter,
            returnTotalDocumentsCount: true,
        });
    }

    static async getTransactionByDepositCount(
        network: string,
        docId: string
    ): Promise<IHubTransaction | null> {
        return (await db.getDocument({
            collectionId: collectionId.get(network) || "",
            docId,
        })) as IHubTransaction;
    }
}
