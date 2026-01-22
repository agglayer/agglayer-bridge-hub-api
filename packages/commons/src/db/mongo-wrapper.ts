import { Logger, DatabaseError } from "@polygonlabs/servercore";
import type { Collection, Document } from "mongodb";
import type { MongoOperation, MongoOperationConfig } from "./types";

/**
 * Generic MongoDB operation wrapper with logging and error handling
 *
 * This utility provides a consistent way to execute MongoDB operations with:
 * - Automatic logging of operation start/success/failure
 * - Comprehensive error handling with try-catch
 * - Contextual information for debugging
 *
 * @template TDocument - The document type for the MongoDB collection
 * @template TResult - The expected return type of the operation
 *
 * @param collection - The MongoDB collection to operate on
 * @param operation - A function that receives the collection and performs the desired operation
 * @param config - Optional configuration for logging and error handling
 *
 * @returns Promise resolving to the operation result
 * @throws {DatabaseError} Throws DatabaseError with operation context after logging
 *
 * @example
 * ```typescript
 * // Find documents
 * const users = await executeMongoOperation(
 *   usersCollection,
 *   (collection) => collection.find({ status: 'active' }).toArray(),
 *   { operationName: 'findActiveUsers' }
 * );
 *
 * // Insert a document
 * const result = await executeMongoOperation(
 *   usersCollection,
 *   (collection) => collection.insertOne({ name: 'John', email: 'john@example.com' }),
 *   { operationName: 'insertUser', logContext: { email: 'john@example.com' } }
 * );
 *
 * // Update multiple documents
 * const updateResult = await executeMongoOperation(
 *   usersCollection,
 *   (collection) => collection.updateMany(
 *     { status: 'pending' },
 *     { $set: { status: 'active' } }
 *   ),
 *   { operationName: 'activatePendingUsers' }
 * );
 *
 * // Aggregate pipeline
 * const stats = await executeMongoOperation(
 *   ordersCollection,
 *   (collection) => collection.aggregate([
 *     { $match: { status: 'completed' } },
 *     { $group: { _id: '$userId', total: { $sum: '$amount' } } }
 *   ]).toArray(),
 *   { operationName: 'calculateUserTotals' }
 * );
 * ```
 */
export async function executeMongoOperation<
	TDocument extends Document = Document,
	TResult = unknown,
>(
	collection: Collection<TDocument>,
	operation: MongoOperation<TDocument, TResult>,
	config: MongoOperationConfig = {}
): Promise<TResult> {
	const { operationName = "mongoOperation", logContext = {} } = config;

	const collectionName = collection.collectionName;
	const dbName = collection.dbName;

	// Log operation start
	Logger.info({
		location: "MongoWrapper",
		operation: operationName,
		collection: collectionName,
		database: dbName,
		message: `Starting operation: ${operationName}`,
		...logContext,
	});

	try {
		// Execute the MongoDB operation
		const result = await operation(collection);

		// Log success
		Logger.info({
			location: "MongoWrapper",
			operation: operationName,
			collection: collectionName,
			database: dbName,
			message: `Operation successful: ${operationName}`,
			...logContext,
		});

		return result;
	} catch (error) {
		// Throw DatabaseError with context (logging happens at handler level)
		throw new DatabaseError(
			`MongoDB operation failed`,
			error instanceof Error ? error : undefined,
			{
				context: {
					operationName,
					collectionName,
					dbName,
					...logContext,
				},
			}
		);
	}
}
