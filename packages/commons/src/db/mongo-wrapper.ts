import { Logger } from "@polygonlabs/servercore";
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
 * @throws Re-throws any errors after logging them
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
	const {
		operationName = "mongoOperation",
		logContext = {},
		suppressErrorLog = false,
	} = config;

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
		// Log error unless suppressed
		if (!suppressErrorLog) {
			Logger.error({
				location: "MongoWrapper",
				operation: operationName,
				collection: collectionName,
				database: dbName,
				message: `Operation failed: ${operationName}`,
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				...logContext,
			});
		}

		// Re-throw the error for caller to handle
		throw error;
	}
}

/**
 * Batch MongoDB operation wrapper for executing multiple operations sequentially
 *
 * Executes multiple MongoDB operations in sequence with individual error handling.
 * If any operation fails, remaining operations will still be attempted.
 *
 * @template TDocument - The document type for the MongoDB collection
 *
 * @param collection - The MongoDB collection to operate on
 * @param operations - Array of operations to execute
 *
 * @returns Promise resolving to an array of results with success/failure status
 *
 * @example
 * ```typescript
 * const results = await executeBatchMongoOperations(usersCollection, [
 *   {
 *     operation: (col) => col.insertOne({ name: 'Alice' }),
 *     config: { operationName: 'insertAlice' }
 *   },
 *   {
 *     operation: (col) => col.insertOne({ name: 'Bob' }),
 *     config: { operationName: 'insertBob' }
 *   }
 * ]);
 * ```
 */
export async function executeBatchMongoOperations<
	TDocument extends Document = Document,
>(
	collection: Collection<TDocument>,
	operations: Array<{
		operation: MongoOperation<TDocument, unknown>;
		config?: MongoOperationConfig;
	}>
): Promise<Array<{ success: boolean; data?: unknown; error?: Error }>> {
	const results: Array<{ success: boolean; data?: unknown; error?: Error }> =
		[];

	Logger.info({
		location: "MongoWrapper",
		collection: collection.collectionName,
		database: collection.dbName,
		operationCount: operations.length,
		message: `Starting batch operation with ${operations.length} operations`,
	});

	for (let i = 0; i < operations.length; i++) {
		const { operation, config = {} } = operations[i];
		const operationName = config.operationName || `batchOperation${i + 1}`;

		try {
			const result = await executeMongoOperation(collection, operation, {
				...config,
				operationName,
			});
			results.push({ success: true, data: result });
		} catch (error) {
			results.push({
				success: false,
				error:
					error instanceof Error ? error : new Error(String(error)),
			});
		}
	}

	const successCount = results.filter((r) => r.success).length;
	Logger.info({
		location: "MongoWrapper",
		collection: collection.collectionName,
		database: collection.dbName,
		total: operations.length,
		successful: successCount,
		failed: operations.length - successCount,
		message: `Batch operation completed: ${successCount}/${operations.length} successful`,
	});

	return results;
}
