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
}

/**
 * Generic MongoDB operation function type
 * Represents any method that can be called on a MongoDB Collection
 */
export type MongoOperation<TDocument extends Document, TResult> = (
	collection: Collection<TDocument>
) => Promise<TResult>;
