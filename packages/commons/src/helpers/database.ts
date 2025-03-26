import { Firestore } from "@google-cloud/firestore";

let db: Firestore;

export class DatabaseClient {
    /**
     * @constructor
     */
    constructor(projectId: string, databaseId: string) {
        db = new Firestore({ projectId, databaseId });
    }

    public async addDocument(
        collectionName: string,
        docName: string,
        doc: object
    ) {
        const docRef = db.collection(collectionName).doc(docName);

        await docRef.set(doc);
    }

    public async getAllDocuments(collectionName: string) {
        const snapshot = await db.collection(collectionName).get();
        return snapshot;
    }
}
