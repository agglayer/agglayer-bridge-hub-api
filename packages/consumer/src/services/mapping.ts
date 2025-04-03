import type { DatabaseClient } from "bridge-hub-commons/helpers/database";
import type { IHubTokenMappings } from "bridge-hub-commons/interfaces/token_mapping";

export default class TokenMappingsService {
    constructor(
        private database: DatabaseClient,
        private collectionName: string = "tokenMappings"
    ) {}

    public async saveTokenMappings(
        mappings: IHubTokenMappings[]
    ): Promise<void> {
        this.database.addDocuments(this.collectionName, mappings);
    }
}
