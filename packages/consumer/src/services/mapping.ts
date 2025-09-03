import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import type { IHubTokenMappings } from "../interfaces/token_mapping";

export default class TokenMappingsService {
    constructor(
        private database: DatabaseClient,
        private collectionId: string = "bridge_hub_api_tokenMappings"
    ) {}

    public async saveTokenMappings(
        mappings: IHubTokenMappings[]
    ): Promise<void> {
        this.database.addDocuments(this.collectionId, mappings);
    }
}
