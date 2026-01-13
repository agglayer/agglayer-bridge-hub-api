# MongoDB Wrapper Utilities

Generic MongoDB operation wrapper with built-in logging and error handling using `@polygonlabs/servercore` Logger.

## Features

- **Automatic Logging**: All operations are logged with structured context
- **Error Handling**: Comprehensive try-catch blocks with error logging
- **Generic Wrapper**: Works with any MongoDB collection method
- **TypeScript Support**: Full type safety with TypeScript generics
- **Batch Operations**: Execute multiple operations with individual error handling

## Installation

The MongoDB utilities are already included in the `@agglayer/bridge-hub-commons` package. Just import and use:

```typescript
import {
	executeMongoOperation,
	MongoClient,
} from "@agglayer/bridge-hub-commons";
```

## Basic Usage

### Single Operation

```typescript
import {
	executeMongoOperation,
	MongoClient,
} from "@agglayer/bridge-hub-commons";

// Connect to MongoDB
const client = new MongoClient("mongodb://localhost:27017");
await client.connect();

const db = client.db("myDatabase");
const usersCollection = db.collection("users");

// Find documents
const activeUsers = await executeMongoOperation(
	usersCollection,
	(collection) => collection.find({ status: "active" }).toArray(),
	{ operationName: "findActiveUsers" }
);

// Insert a document
const insertResult = await executeMongoOperation(
	usersCollection,
	(collection) =>
		collection.insertOne({
			name: "John Doe",
			email: "john@example.com",
			status: "active",
		}),
	{
		operationName: "insertUser",
		logContext: { email: "john@example.com" },
	}
);

// Update documents
const updateResult = await executeMongoOperation(
	usersCollection,
	(collection) =>
		collection.updateMany(
			{ status: "pending" },
			{ $set: { status: "active", updatedAt: new Date() } }
		),
	{ operationName: "activatePendingUsers" }
);

// Delete documents
const deleteResult = await executeMongoOperation(
	usersCollection,
	(collection) => collection.deleteMany({ status: "inactive" }),
	{ operationName: "deleteInactiveUsers" }
);
```

### Aggregation Pipeline

```typescript
import { executeMongoOperation } from "@agglayer/bridge-hub-commons";

const stats = await executeMongoOperation(
	ordersCollection,
	(collection) =>
		collection
			.aggregate([
				{ $match: { status: "completed" } },
				{
					$group: {
						_id: "$userId",
						total: { $sum: "$amount" },
						count: { $sum: 1 },
					},
				},
				{ $sort: { total: -1 } },
			])
			.toArray(),
	{
		operationName: "calculateUserOrderStats",
		logContext: { timeRange: "last30days" },
	}
);
```

### Batch Operations

Execute multiple operations with individual error handling:

```typescript
import { executeBatchMongoOperations } from "@agglayer/bridge-hub-commons";

const results = await executeBatchMongoOperations(usersCollection, [
	{
		operation: (col) =>
			col.insertOne({ name: "Alice", email: "alice@example.com" }),
		config: { operationName: "insertAlice" },
	},
	{
		operation: (col) =>
			col.insertOne({ name: "Bob", email: "bob@example.com" }),
		config: { operationName: "insertBob" },
	},
	{
		operation: (col) =>
			col.updateOne({ name: "Charlie" }, { $set: { status: "active" } }),
		config: { operationName: "updateCharlie" },
	},
]);

// Check results
results.forEach((result, index) => {
	if (result.success) {
		console.log(`Operation ${index + 1} succeeded:`, result.data);
	} else {
		console.error(`Operation ${index + 1} failed:`, result.error);
	}
});
```

## Configuration Options

### MongoOperationConfig

```typescript
interface MongoOperationConfig {
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
```

## Error Handling

Errors are automatically logged and then re-thrown, allowing you to handle them as needed:

```typescript
try {
	const result = await executeMongoOperation(
		usersCollection,
		(collection) => collection.findOne({ _id: userId }),
		{ operationName: "findUserById", logContext: { userId } }
	);

	if (!result) {
		throw new Error("User not found");
	}

	return result;
} catch (error) {
	// Error has already been logged by the wrapper
	// Handle the error as needed
	throw new ApiError("Failed to fetch user", 500);
}
```

## Logging Format

All operations produce structured logs compatible with `@polygonlabs/servercore` Logger:

**Success Log:**

```json
{
	"location": "MongoWrapper",
	"function": "executeMongoOperation",
	"operation": "findActiveUsers",
	"collection": "users",
	"database": "myDatabase",
	"message": "Operation successful: findActiveUsers"
}
```

**Error Log:**

```json
{
	"location": "MongoWrapper",
	"function": "executeMongoOperation",
	"operation": "updateUser",
	"collection": "users",
	"database": "myDatabase",
	"message": "Operation failed: updateUser",
	"error": "Document not found",
	"stack": "Error: Document not found\n    at ..."
}
```

## Best Practices

1. **Use Descriptive Operation Names**: This makes logs easier to search and understand

    ```typescript
    {
    	operationName: "findActiveUsersByEmail";
    } // Good
    {
    	operationName: "find";
    } // Less helpful
    ```

2. **Include Relevant Context**: Add identifying information to help with debugging

    ```typescript
    { logContext: { userId: user.id, action: 'passwordReset' } }
    ```

3. **Handle Errors Appropriately**: The wrapper logs errors but you still need to handle them

    ```typescript
    try {
    	await executeMongoOperation(/* ... */);
    } catch (error) {
    	// Transform to application-specific error
    	throw new ApiError("Operation failed", 500);
    }
    ```

4. **Use Batch Operations for Independent Operations**: When operations don't depend on each other
    ```typescript
    // Instead of multiple try-catch blocks
    const results = await executeBatchMongoOperations(collection, operations);
    ```

## TypeScript Support

Full type inference for MongoDB operations:

```typescript
import type { Collection, Document } from "@agglayer/bridge-hub-commons";

interface User extends Document {
	name: string;
	email: string;
	status: "active" | "inactive";
}

const usersCollection: Collection<User> = db.collection<User>("users");

// TypeScript knows the return type
const users: User[] = await executeMongoOperation(
	usersCollection,
	(collection) => collection.find({ status: "active" }).toArray(),
	{ operationName: "findActiveUsers" }
);
```
