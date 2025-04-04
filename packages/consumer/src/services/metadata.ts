import type { DatabaseClient } from "bridge-hub-commons/helpers/database";
import type { IHubMetadata } from "bridge-hub-commons/interfaces/metadata";

export default class MetadataService {
    constructor(
        private database: DatabaseClient,
        private collectionId: string = "metadata",
        private docId: string = "lastIndexedTransactions"
    ) {}

    public async saveLastIndexedTxs(data: IHubMetadata): Promise<void> {
        this.database.updateDocuments(this.collectionId, [data], [this.docId]);
    }

    public async getLastIndexedTxs(): Promise<IHubMetadata> {
        const data = await this.database.getDocument(
            this.collectionId,
            this.docId
        );
        return data as IHubMetadata;
    }
}
