import {
    DocumentReference,
    Firestore,
    Transaction,
    type Query,
    type QuerySnapshot,
} from "@google-cloud/firestore";
import type {
    IDocumentConditionalModifications,
    IQueryFilterOperationParams,
    IQueryOrderOperationParams,
} from "../interfaces/database";

let db: Firestore;

export class DatabaseClient {
    /**
     * @constructor
     */
    constructor(projectId: string, databaseId: string) {
        db = new Firestore({ projectId, databaseId });
    }

    private verifyCondition(
        docData: any,
        condition: IQueryFilterOperationParams
    ): boolean {
        switch (condition.operator) {
            case "==":
                return docData[condition.field] === condition.value;
            case "!=":
                return docData[condition.field] !== condition.value;
            default:
                return false;
        }
    }

    public async addDocuments(
        collectionName: string,
        docs: any[],
        docIds?: string[]
    ): Promise<void> {
        const batch = db.batch();
        docs.forEach((doc, index) => {
            let docRef: DocumentReference;
            if (docIds) {
                docRef = db.collection(collectionName).doc(docIds[index]);
            } else {
                docRef = db.collection(collectionName).doc();
            }
            batch.set(docRef, doc);
        });
        await batch.commit();
    }

    public async updateDocuments(
        collectionName: string,
        docDatas: any[],
        docIds: string[]
    ) {
        const batch = db.batch();
        docDatas.forEach((doc, index) => {
            const docRef: DocumentReference = db
                .collection(collectionName)
                .doc(docIds[index]);
            batch.set(docRef, doc, { merge: true });
        });
        await batch.commit();
    }

    public async conditionalUpdateDocuments(
        collectionName: string,
        docDatas: any[],
        docIds: string[],
        conditions: IQueryFilterOperationParams[],
        conditionModifications: IDocumentConditionalModifications[]
    ): Promise<void> {
        const transaction = await db.runTransaction(async (t: Transaction) => {
            const docs = await Promise.all(
                docIds.map((id) => db.collection(collectionName).doc(id).get())
            );

            const updates: any[] = [];
            docs.forEach((doc, index) => {
                if (doc.exists) {
                    const docData = doc.data();
                    const updatedDocData = { ...docData }; // Clone document data
                    let conditionsMet = true;

                    conditions.forEach((condition) => {
                        conditionsMet =
                            conditionsMet &&
                            this.verifyCondition(docData, condition);
                    });
                    conditionModifications.forEach((modification) => {
                        updatedDocData[modification.field] = conditionsMet
                            ? modification.value
                            : updatedDocData[modification.field];
                    });
                } else {
                    const updatedDocData = { ...docDatas[index] }; // Clone docData
                    // If document doesn't exist, set the default value
                    conditionModifications.forEach((modification) => {
                        updatedDocData[modification.field] =
                            modification.defaultValue;
                    });
                    updates.push({
                        docId: doc.id,
                        updateData: updatedDocData,
                    });
                }
            });

            // Apply updates to Firestore inside the transaction
            updates.forEach(({ docId, updateData }) => {
                const docRef = db.collection(collectionName).doc(docId);
                t.set(docRef, updateData, { merge: true });
            });
        });
    }

    public async getDocuments(
        collectionName: string,
        filter?: IQueryFilterOperationParams[],
        limit?: number,
        order?: IQueryOrderOperationParams[],
        startAfterCursor?: string | number
    ): Promise<any[]> {
        const collectionRef = db.collection(collectionName);
        let query: Query = collectionRef;
        filter?.forEach((condition) => {
            query = query.where(
                condition.field,
                condition.operator,
                condition.value
            );
        });
        order?.forEach((condition) => {
            query = query.orderBy(condition.field, condition.order);
        });
        if (startAfterCursor) {
            query = query.startAfter(startAfterCursor);
        }
        if (limit) {
            query = query.limit(limit);
        }

        const snapshot: QuerySnapshot = await query.get();
        const documents: any[] = [];
        snapshot.forEach((docSnapshot) => {
            documents.push(docSnapshot.data());
        });
        return documents;
    }
}
