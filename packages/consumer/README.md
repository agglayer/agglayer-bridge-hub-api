# Bridge Hub Consumer

Blockchain event indexer that monitors bridge contracts and syncs transaction data to MongoDB.

## Overview

The Consumer package is the data ingestion layer of the Bridge Hub system. It monitors blockchain networks for bridge events, fetches transaction data from external Bridge Service APIs, and maintains an up-to-date database of bridge transactions.

## Features

- Real-time blockchain event monitoring via Aggkit
- Bridge Service API polling for new transactions
- Automatic claim readiness detection
- Token mapping management
- Configurable for multiple networks (mainnet, testnet, devnet)
- Automatic reconnection and error recovery

## Architecture

```
External Sources          Consumer Services          Database
─────────────────         ─────────────────          ────────

Bridge Service API  ──▶   BridgeAPIConsumer   ──▶   MongoDB
                                                      ├─ transactions
Blockchain (Aggkit) ──▶   ClaimReadinessConsumer    ├─ token_mappings
                                                      └─ metadata
```

## Installation

```bash
# From package directory
bun install
```

## Configuration

Create a `.env` file in the package root with the following variables:

**Required:**

- `NETWORK_ID` - Chain network identifier (e.g., 1 for Ethereum)
- `NETWORK` - Network environment (mainnet, testnet, or devnet)
- `BRIDGE_SERVICE_URL` - Bridge Service API URL
- `BRIDGE_CONTRACT_ADDRESS` - Bridge contract address
- `MONGODB_CONNECTION_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name

**Optional:**

- `RPC_URL` - Optional RPC endpoint for direct blockchain access
- `ETROG_UPDATE_BLOCK_NUMBER` - Starting block for Etrog upgrade
- `METADATA_DOC` - Metadata document name (default: lastIndexedTransactions)
- `SENTRY_DSN` - Error tracking DSN

For detailed configuration with examples, descriptions, and best practices, see **[DEPLOYMENT.md - Consumer Configuration](../../DEPLOYMENT.md#consumer-package)**.

## Usage

### Development

```bash
# Run with hot reload
bun run dev
```

### Production

```bash
# Build
bun run build

# Start
bun start
```

## Components

The Consumer runs as a single Node.js process containing two main components, each with scheduled cron jobs that fetch data from the Aggkit Bridge Service.

### BridgeAPIConsumer

Contains three cron jobs that poll the Aggkit Bridge Service:

#### 1. bridgesCron

- **Purpose**: Fetches new bridge deposit transactions
- **Data Source**: Aggkit Bridge Service `/bridges` API
- **Database**: Inserts transactions into `transactions` collection with status `BRIDGED`
- **Metadata**: Updates `lastIndexedBridgeDepositCount`
- **Interval**: Configurable (default: 10 seconds)

#### 2. claimsCron

- **Purpose**: Fetches claim events from the blockchain
- **Data Source**: Aggkit Bridge Service `/claims` API
- **Database**: Updates transactions to status `CLAIMED`, adds claim hash and timestamp
- **Metadata**: Updates `lastIndexedClaimBlockNumber`
- **Interval**: Configurable

#### 3. mappingsCron

- **Purpose**: Fetches token mapping events
- **Data Source**: Aggkit Bridge Service `/mappings` API
- **Database**: Inserts/updates token mappings in `mappings` collection
- **Metadata**: Updates `lastIndexedMappingBlockNumber`
- **Interval**: Configurable

### ClaimReadinessConsumer

Contains one cron job that determines claim eligibility:

#### 4. readyToClaimCron

- **Purpose**: Detects when transactions become claimable
- **Data Source**: Aggkit Bridge Service `/l1-info-tree` API
- **Database**: Updates transactions from `BRIDGED` to `READY_TO_CLAIM`, sets `leafIndexForProof`
- **Logic**: Compares L1 info tree data with transaction data
- **Interval**: Configurable

**Important**: All cron jobs fetch data from Aggkit Bridge Service APIs - the consumer does NOT directly monitor the blockchain. Aggkit is a per-network service operated by chain owners that indexes blockchain events.

**Process Architecture:**

- All 4 crons run in a single Node.js process
- Each cron is a scheduled job at configured intervals
- Metadata collection tracks progress for resume after restarts

For detailed architecture, see [ARCHITECTURE.md - Consumer Internal Architecture](../../ARCHITECTURE.md#consumer-internal-architecture).

### Services

#### TransactionsService

Manages transaction documents in MongoDB.

```typescript
// Insert or update transaction
await transactionsService.upsertOne(transaction);

// Bulk operations
await transactionsService.bulkWrite(operations);

// Query transactions
const txs = await transactionsService.find({ status: "READY_TO_CLAIM" });
```

#### TokenMappingsService

Manages token address mappings between networks.

```typescript
// Store token mapping
await tokenMappingsService.upsertOne(mapping);

// Query mappings
const mapping = await tokenMappingsService.findOne({
	originNetwork: 1,
	originTokenAddress: "0x...",
});
```

#### MetadataService

Tracks indexing metadata and progress.

```typescript
// Update last indexed position
await metadataService.updateLastIndexed(depositCount);

// Get current position
const metadata = await metadataService.getMetadata();
```

## Data Flow

1. **Initial Indexing**

    ```
    Bridge Service API → BridgeAPIConsumer → TransactionsService → MongoDB
    ```

2. **Claim Readiness Updates**

    ```
    Blockchain (Aggkit) → ClaimReadinessConsumer → TransactionsService → MongoDB
    ```

3. **Token Mappings**
    ```
    Bridge Service API → BridgeAPIConsumer → TokenMappingsService → MongoDB
    ```

## MongoDB Collections

### Transactions Collection

Stores bridge transaction data:

```javascript
{
  _id: ObjectId,
  hubUID: "unique-id",
  sourceNetwork: 1,
  destinationNetwork: 2442,
  status: "READY_TO_CLAIM",
  leafType: "ASSET",
  amount: "1000000000000000000",
  depositCount: 42,
  transactionHash: "0x...",
  claimTransactionHash: null,
  timestamp: ISODate("..."),
  // ... additional fields
}
```

**Indexes:**

- `status`
- `sourceNetwork`, `destinationNetwork`
- `depositCount`
- `hubUID` (unique)

### Token Mappings Collection

```javascript
{
  _id: ObjectId,
  originNetwork: 0,
  originTokenAddress: "0x...",
  wrappedTokenAddress: "0x...",
  destinationNetwork: 1,
  // ... metadata
}
```

### Metadata Collection

```javascript
{
  _id: "lastIndexedTransactions",
  lastDepositCount: 1000,
  lastUpdated: ISODate("...")
}
```

## Error Handling

The consumer includes comprehensive error handling:

- **API Failures**: Logs errors and continues on next poll
- **MongoDB Failures**: Logs errors, attempts reconnection
- **Blockchain RPC Failures**: Automatic retry with backoff
- **Invalid Data**: Logs validation errors, skips invalid records

All errors are logged with context via `@polygonlabs/servercore` Logger and optionally sent to Sentry.

## Monitoring

### Logs

The consumer outputs structured logs:

```javascript
// Info logs
{ location: "BridgeAPIConsumer.poll", message: "Fetched 5 transactions" }

// Error logs
{ location: "ClaimReadinessConsumer.update", error: "RPC timeout", data: {...} }
```

### Health Check

Built-in health check server on port 8080 (configurable):

```bash
curl http://localhost:8080/health
```

## Testing

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage
```

Test coverage includes:

- Service unit tests
- Mapper tests
- Mock MongoDB operations
- Mock API responses

## Deployment

### Docker

```dockerfile
FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

CMD ["bun", "dist/index.js"]
```

### Multiple Networks

Run one consumer instance per network:

```bash
# Mainnet consumer
NETWORK_ID=1 NETWORK=mainnet bun start

# Polygon consumer
NETWORK_ID=137 NETWORK=mainnet bun start
```

## Troubleshooting

### Consumer not indexing

**Check Bridge Service connectivity:**

```bash
curl $BRIDGE_SERVICE_URL/bridges?network_id=$NETWORK_ID&limit=1
```

**Check MongoDB connection:**

```bash
mongosh $MONGODB_CONNECTION_URI
```

**Check logs for errors:**

```bash
grep -i error logs/consumer.log
```

### Transactions stuck in BRIDGED status

- Verify ClaimReadinessConsumer is running
- Check blockchain RPC connectivity
- Verify bridge contract address is correct
- Check Aggkit is returning valid data

### Memory Issues

- Reduce poll batch size
- Increase poll interval
- Monitor MongoDB query performance
- Add indexes to collections

## Performance

- **Throughput**: ~120 transactions/minute (depends on API)
- **Latency**: ~10-20 seconds from bridge event to database
- **Memory**: ~100-200MB typical usage
- **CPU**: Low (<5% on modern hardware)

## Dependencies

- `@agglayer/bridge-hub-commons` - Shared types
- `@polygonlabs/servercore` - Logging and utilities
- `@polygonlabs/servercore-mongo` - MongoDB client
- `viem` - Blockchain interactions

## Development

### Adding New Event Listeners

1. Define event ABI in `interfaces/`
2. Add listener in `ClaimReadinessConsumer`
3. Create mapper function
4. Update service to handle new data
5. Add tests

### Modifying Mappers

Mappers are in `src/mappers/`:

- `transaction.ts` - Bridge transaction mapping
- `mapping.ts` - Token mapping transformation
- `metadata.ts` - Metadata updates

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the repository root.

## License

See [LICENSE](../../LICENSE) in the repository root.
