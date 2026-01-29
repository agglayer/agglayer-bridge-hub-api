# Bridge Hub Consumer

Blockchain event indexer that monitors bridge contracts and syncs transaction data to MongoDB. For complete system architecture and deployment topology, see [ARCHITECTURE.md - Production Cluster Architecture](../../ARCHITECTURE.md#production-cluster-architecture).

## Overview

The Consumer is the data ingestion layer that polls the Aggkit Bridge Service for bridge events and maintains an up-to-date database of bridge transactions. Each consumer instance runs four cron jobs in a single Node.js process. For detailed information about the cron job architecture, see [ARCHITECTURE.md - Consumer Internal Architecture](../../ARCHITECTURE.md#consumer-internal-architecture).

## Quick Start

```bash
# Install dependencies
bun install

# Development (with hot reload)
bun run dev

# Production
bun run build
bun start

# Run tests
bun test
```

## Configuration

Create a `.env` file with required environment variables. For detailed configuration with examples and best practices, see [DEPLOYMENT.md - Consumer Configuration](../../DEPLOYMENT.md#consumer-package).

**Required variables:**

- `NETWORK_ID` - Chain network identifier
- `NETWORK` - Network environment (mainnet, testnet, devnet)
- `BRIDGE_SERVICE_URL` - Aggkit Bridge Service API URL
- `BRIDGE_CONTRACT_ADDRESS` - Bridge contract address
- `MONGODB_CONNECTION_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name

## Services API Reference

The Consumer provides three main services for database operations:

### TransactionsService

Manages bridge transaction documents in MongoDB.

```typescript
import { TransactionsService } from "./services/transaction";

const service = new TransactionsService(collection);

// Insert or update a single transaction
await service.upsertOne(transaction: IHubTransaction): Promise<void>

// Bulk write operations
await service.bulkWrite(operations: AnyBulkWriteOperation<ITransactionDocument>[]): Promise<void>

// Query transactions
const txs = await service.find(filter: Filter<ITransactionDocument>): Promise<ITransactionDocument[]>

// Find one transaction
const tx = await service.findOne(filter: Filter<ITransactionDocument>): Promise<ITransactionDocument | null>

// Update one transaction
await service.updateOne(
  filter: Filter<ITransactionDocument>,
  update: UpdateFilter<ITransactionDocument>
): Promise<void>
```

### TokenMappingsService

Manages token address mappings between networks.

```typescript
import { TokenMappingsService } from "./services/mapping";

const service = new TokenMappingsService(collection);

// Insert or update token mapping
await service.upsertOne(mapping: ITokenMapping): Promise<void>

// Find token mapping
const mapping = await service.findOne(filter: {
  originNetwork: number,
  originTokenAddress: string
}): Promise<ITokenMapping | null>

// Bulk write mappings
await service.bulkWrite(operations: AnyBulkWriteOperation<ITokenMapping>[]): Promise<void>
```

### MetadataService

Tracks indexing metadata and progress for resume capability.

```typescript
import { MetadataService } from "./services/metadata";

const service = new MetadataService(collection, metadataDocName);

// Update last indexed bridge deposit count
await service.updateLastIndexedBridgeDepositCount(count: number): Promise<void>

// Update last indexed claim block number
await service.updateLastIndexedClaimBlockNumber(blockNumber: number): Promise<void>

// Update last indexed mapping block number
await service.updateLastIndexedMappingBlockNumber(blockNumber: number): Promise<void>

// Get current metadata
const metadata = await service.getMetadata(): Promise<IMetadata | null>
```

## Package Structure

```
consumer/
├── src/
│   ├── bridge_api_consumer.ts        # Contains bridgesCron, claimsCron, mappingsCron
│   ├── claim_readiness_consumer.ts   # Contains readyToClaimCron
│   ├── services/                     # Data access layer
│   │   ├── transaction.ts            # TransactionsService
│   │   ├── mapping.ts                # TokenMappingsService
│   │   └── metadata.ts               # MetadataService
│   ├── mappers/                      # Data transformation
│   └── interfaces/                   # Local type definitions
├── tests/
└── dist/
```

## See Also

- [README.md](../../README.md) - System overview and features
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Complete system architecture, cron job details, and database schema
- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Configuration, multi-network deployment, and operations guide
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development and testing guidelines
- [SECURITY.md](../../SECURITY.md) - Security information and bug bounty
