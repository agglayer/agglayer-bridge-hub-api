import {
    DocumentReference,
    DocumentSnapshot,
    Firestore,
    Transaction,
    type DocumentData,
    type Query,
    type QuerySnapshot,
} from "@google-cloud/firestore";
import type {
    IDocumentConditionalModifications,
    IQueryFilterOperationParams,
    IQueryOrderOperationParams,
} from "../interfaces/database";
import { Logger } from "./logger";
import { DatabaseError } from "../errors/databse_errors";
import { errorCodes } from "../errors/error_codes";

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
        collectionId: string,
        docDatas: any[],
        docIds?: string[]
    ): Promise<void> {
        Logger.info({
            location: "DatabaseClient",
            function: "addDocuments",
            status: "function called",
            data: { collectionId, docIds },
        });
        try {
            const batch = db.batch();
            docDatas.forEach((doc, index) => {
                let docRef: DocumentReference;
                if (docIds) {
                    docRef = db.collection(collectionId).doc(docIds[index]);
                } else {
                    docRef = db.collection(collectionId).doc();
                }
                batch.set(docRef, doc);
            });
            await batch.commit();
            Logger.info({
                location: "DatabaseClient",
                function: "addDocuments",
                status: "function completed",
                data: { collectionId, docIds },
            });
        } catch (error) {
            Logger.error({
                location: "DatabaseClient",
                function: "addDocuments",
                status: "function failed",
                data: {
                    error: (error as Error).message,
                    collectionId,
                    docIds,
                    docDatas,
                },
            });
            throw new DatabaseError("Error in addDocuments", error as Error, {
                code: errorCodes.datastore.DATASTORE_WRITE_ERROR,
            });
        }
    }

    public async updateDocuments(
        collectionId: string,
        docDatas: any[],
        docIds: string[]
    ) {
        Logger.info({
            location: "DatabaseClient",
            function: "updateDocuments",
            status: "function called",
            data: { collectionId, docIds },
        });
        try {
            const batch = db.batch();
            docDatas.forEach((doc, index) => {
                const docRef: DocumentReference = db
                    .collection(collectionId)
                    .doc(docIds[index]);
                batch.set(docRef, doc, { merge: true });
            });
            await batch.commit();
            Logger.info({
                location: "DatabaseClient",
                function: "updateDocuments",
                status: "function completed",
                data: { collectionId, docIds },
            });
        } catch (error) {
            Logger.error({
                location: "DatabaseClient",
                function: "updateDocuments",
                status: "function failed",
                data: {
                    error: (error as Error).message,
                    collectionId,
                    docIds,
                    docDatas,
                },
            });
            throw new DatabaseError(
                "Error in updateDocuments",
                error as Error,
                { code: errorCodes.datastore.DATASTORE_WRITE_ERROR }
            );
        }
    }

    public async conditionalUpdateDocuments(
        collectionId: string,
        docDatas: any[],
        docIds: string[],
        conditions: IQueryFilterOperationParams[],
        conditionModifications: IDocumentConditionalModifications[]
    ): Promise<void> {
        Logger.info({
            location: "DatabaseClient",
            function: "conditionalUpdateDocuments",
            status: "function called",
            data: {
                collectionId,
                docIds,
                conditions,
                conditionModifications,
            },
        });
        try {
            await db.runTransaction(async (t: Transaction) => {
                const docs = await Promise.all(
                    docIds.map((id) =>
                        db.collection(collectionId).doc(id).get()
                    )
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
                    const docRef = db.collection(collectionId).doc(docId);
                    t.set(docRef, updateData, { merge: true });
                });
            });
            Logger.info({
                location: "DatabaseClient",
                function: "conditionalUpdateDocuments",
                status: "function completed",
                data: {
                    collectionId,
                    docIds,
                    conditions,
                    conditionModifications,
                },
            });
        } catch (error) {
            Logger.error({
                location: "DatabaseClient",
                function: "conditionalUpdateDocuments",
                status: "function failed",
                data: {
                    error: (error as Error).message,
                    collectionId,
                    docIds,
                    conditions,
                    conditionModifications,
                    docDatas,
                },
            });
            throw new DatabaseError(
                "Error in conditionalUpdateDocuments",
                error as Error,
                { code: errorCodes.datastore.DATASTORE_WRITE_ERROR }
            );
        }
    }

    public async getDocuments(
        collectionId: string,
        filter?: IQueryFilterOperationParams[],
        limit?: number,
        order?: IQueryOrderOperationParams[],
        startAfterCursor?: string | number
    ): Promise<any[]> {
        try {
            const collectionRef = db.collection(collectionId);
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
        } catch (error) {
            Logger.error({
                location: "DatabaseClient",
                function: "getDocuments",
                status: "function failed",
                data: {
                    error: (error as Error).message,
                    collectionId,
                    filter,
                    limit,
                    order,
                    startAfterCursor,
                },
            });
            throw new DatabaseError("Error in getDocuments", error as Error, {
                code: errorCodes.datastore.DATASTORE_READ_ERROR,
            });
        }
    }

    public async getDocument(
        collectionId: string,
        docId: string
    ): Promise<DocumentData | undefined> {
        try {
            const documentRef = db.collection(collectionId).doc(docId);
            const snapshot: DocumentSnapshot = await documentRef.get();
            const document = snapshot.data();
            return document;
        } catch (error) {
            Logger.error({
                location: "DatabaseClient",
                function: "getDocument",
                status: "function failed",
                data: {
                    error: (error as Error).message,
                    collectionId,
                    docId,
                },
            });
            throw new DatabaseError("Error in getDocument", error as Error, {
                code: errorCodes.datastore.DATASTORE_READ_ERROR,
            });
        }
    }
}
