import { MongoClient, type Db } from "@agglayer/bridge-hub-commons";
import { Logger } from "@polygonlabs/servercore";

/**
 * MongoDB client wrapper for the consumer application
 * Provides connection management and database access
 */
export class MongoDBClient {
	private client: MongoClient | null = null;
	private db: Db | null = null;

	constructor(
		private readonly connectionString: string,
		private readonly databaseName: string
	) {}

	/**
	 * Connect to MongoDB
	 */
	async connect(): Promise<void> {
		try {
			Logger.info({
				location: "MongoDBClient",
				function: "connect",
				message: `Connecting to MongoDB database: ${this.databaseName}`,
			});

			this.client = new MongoClient(this.connectionString);
			await this.client.connect();
			this.db = this.client.db(this.databaseName);

			Logger.info({
				location: "MongoDBClient",
				function: "connect",
				message: `Successfully connected to MongoDB database: ${this.databaseName}`,
			});
		} catch (error) {
			Logger.error({
				location: "MongoDBClient",
				function: "connect",
				message: "Failed to connect to MongoDB",
				error: error instanceof Error ? error.message : String(error),
			});
			throw error;
		}
	}

	/**
	 * Get the database instance
	 */
	getDb(): Db {
		if (!this.db) {
			throw new Error("Database not connected. Call connect() first.");
		}
		return this.db;
	}

	/**
	 * Get a collection from the database with proper typing
	 * @template TDocument - The document type for the collection
	 */
	getCollection<TDocument extends Document = Document>(
		collectionName: string
	) {
		return this.getDb().collection<TDocument>(collectionName);
	}

	/**
	 * Close the MongoDB connection
	 */
	async disconnect(): Promise<void> {
		if (this.client) {
			await this.client.close();
			Logger.info({
				location: "MongoDBClient",
				function: "disconnect",
				message: "Disconnected from MongoDB",
			});
		}
	}
}
