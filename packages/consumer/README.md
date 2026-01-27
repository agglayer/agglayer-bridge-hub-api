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

Create a `.env` file in the package root:

```bash
# Network Configuration
NETWORK_ID=1                                    # Chain network identifier
NETWORK=mainnet                                 # mainnet, testnet, or devnet
BRIDGE_CONTRACT_ADDRESS=0x...                   # Bridge contract address

# External Services
BRIDGE_SERVICE_URL=https://bridge-api.polygon.technology
RPC_URL=https://eth-mainnet.g.alchemy.com/...  # Optional, for direct RPC access

# Database
MONGODB_CONNECTION_URI=mongodb://localhost:27017
MONGODB_DB_NAME=bridge_hub

# Optional
ETROG_UPDATE_BLOCK_NUMBER=0                     # Starting block for Etrog upgrade
METADATA_DOC=lastIndexedTransactions            # Metadata document name
SENTRY_DSN=https://...                          # Error tracking
```

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

### BridgeAPIConsumer

Polls the Bridge Service API for new bridge transactions.

**Responsibilities:**

- Fetches deposit transactions from Bridge Service API
- Parses and validates transaction data
- Maps transactions to internal format
- Stores transactions in MongoDB
- Tracks indexing progress via metadata

**Configuration:**

- Poll interval: 10 seconds (configurable via cron expression)
- Batch size: 2 transactions per poll
- Uses `deposit_count` as cursor for pagination

### ClaimReadinessConsumer

Monitors blockchain via Aggkit for claim eligibility events.

**Responsibilities:**

- Monitors destination chain for L1 info tree updates
- Detects when transactions become claimable
- Updates transaction status from BRIDGED → READY_TO_CLAIM
- Detects claim events and updates status to CLAIMED
- Tracks claim transaction hashes and timestamps

**Event Monitoring:**

- Listens for bridge contract events
- Processes events in batches
- Updates MongoDB in real-time

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
