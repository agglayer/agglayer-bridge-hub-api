import type { Collection, Document } from "mongodb";

/**
 * Configuration options for MongoDB operations
 */
export interface MongoOperationConfig {
	/**
	 * Custom operation name for logging purposes
	 * If not provided, the method name will be used
	 */
	operationName?: string;

	/**
	 * Additional context to include in logs
	 */
	logContext?: Record<string, unknown>;

	/**
	 * Whether to suppress error logging (errors will still be thrown)
	 * Default: false
	 */
	suppressErrorLog?: boolean;
}

/**
 * Generic MongoDB operation function type
 * Represents any method that can be called on a MongoDB Collection
 */
export type MongoOperation<TDocument extends Document, TResult> = (
	collection: Collection<TDocument>
) => Promise<TResult>;

/**
 * Result wrapper for MongoDB operations
 */
export interface MongoOperationResult<TResult> {
	success: boolean;
	data?: TResult;
	error?: Error;
}
