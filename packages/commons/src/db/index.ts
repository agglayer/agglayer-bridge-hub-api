/**
 * Database utilities for MongoDB operations
 *
 * Provides generic wrappers for MongoDB operations with:
 * - Automatic logging via @polygonlabs/servercore Logger
 * - Comprehensive error handling with try-catch blocks
 * - Contextual information for debugging
 */

export {
	executeMongoOperation,
	executeBatchMongoOperations,
} from "./mongo-wrapper";

export type {
	MongoOperation,
	MongoOperationConfig,
	MongoOperationResult,
} from "./types";

export { MongoDBClient } from "./mongo-client";

// Re-export commonly used MongoDB types and classes for convenience
export { MongoClient } from "mongodb";

export type {
	Collection,
	Db,
	Document,
	Filter,
	FindOptions,
	InsertOneResult,
	InsertManyResult,
	UpdateResult,
	DeleteResult,
	BulkWriteResult,
	AggregateOptions,
} from "mongodb";
