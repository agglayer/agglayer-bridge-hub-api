import { TransactionStatus } from "bridge-hub-commons/enums/transaction_status";
import type { DatabaseClient } from "bridge-hub-commons/helpers/database";
import type { IHubBridgeTransaction } from "bridge-hub-commons/interfaces/bridge_tx";
import type { IHubClaimTransaction } from "bridge-hub-commons/interfaces/claim_tx";
import { CryptoHasher } from "bun";

export default class TransactionsService {
    constructor(
        private database: DatabaseClient,
        private collectionId: string = "transactions"
    ) {}

    private generateDocId(depositCount: number, sourceNetwork: number): string {
        const hasher = new CryptoHasher("sha256");
        hasher.update(`${depositCount}:${sourceNetwork}`);
        return hasher.digest("hex").slice(0, 32);
    }

    public async saveBridges(
        bridgetransactions: IHubBridgeTransaction[]
    ): Promise<void> {
        const docIds: string[] = [];
        for (const tx of bridgetransactions) {
            const docId = this.generateDocId(tx.depositCount, tx.sourceNetwork);
            docIds.push(docId);
        }
        this.database.conditionalUpdateDocuments(
            this.collectionId,
            bridgetransactions,
            docIds,
            [
                {
                    field: "status",
                    operator: "==",
                    value: TransactionStatus.BRIDGED,
                },
            ],
            [
                {
                    field: "status",
                    value: TransactionStatus.BRIDGED,
                    defaultValue: TransactionStatus.BRIDGED,
                },
            ]
        );
    }

    public async saveClaims(
        claimTransactions: IHubClaimTransaction[]
    ): Promise<void> {
        const docIds: string[] = [];
        for (const tx of claimTransactions) {
            const docId = this.generateDocId(tx.depositCount, tx.sourceNetwork);
            docIds.push(docId);
        }
        this.database.updateDocuments(
            this.collectionId,
            claimTransactions,
            docIds
        );
    }
}
