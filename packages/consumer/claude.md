# Consumer Package - Claude Context

## Package Overview

**Package**: `bridge-hub-consumer`
**Purpose**: Data ingestion layer that monitors blockchain networks and indexes bridge transactions
**Type**: Service (long-running daemon)
**Dependencies**: `@agglayer/bridge-hub-commons`

## Role in the System

Consumer is the **data ingestion layer** that:

1. Polls the Aggkit Bridge Service API for new bridge transactions
2. Fetches claim transaction data from blockchain
3. Transforms external data to internal data models
4. Stores/updates transactions in MongoDB
5. Updates transaction status based on claim readiness
6. Maintains token mappings

```
Aggkit Bridge Service
         ↓
    [Consumer]
         ↓
     MongoDB ← [API]
```

## Package Structure

```
packages/consumer/
├── src/
│   ├── config.ts                      # Environment configuration
│   ├── index.ts                       # Main entry point
│   │
│   ├── bridge_api_consumer.ts         # Polls Bridge Service for new txs
│   ├── claim_readiness_consumer.ts    # Checks claim readiness status
│   │
│   ├── services/                      # Database operations
│   │   ├── transaction.ts             # Transaction CRUD
│   │   ├── mapping.ts                 # Token mapping CRUD
│   │   └── metadata.ts                # Metadata operations
│   │
│   ├── mappers/                       # Data transformation
│   │   ├── transaction.ts             # Bridge API → internal format
│   │   ├── mapping.ts                 # Token mapping transformation
│   │   └── metadata.ts                # Metadata extraction/formatting
│   │
│   ├── interfaces/                    # Package-specific types
│   │   ├── bridge_api_result.ts       # Bridge Service API response
│   │   ├── bridge_tx.ts               # Bridge transaction from API
│   │   ├── claim_tx.ts                # Claim transaction from blockchain
│   │   ├── token_mapping.ts           # Token mapping types
│   │   ├── metadata.ts                # Metadata types
│   │   ├── decoded_global_index.ts    # Global index components
│   │   ├── claim_readiness_config.ts  # Readiness check config
│   │   ├── reorg.ts                   # Blockchain reorg handling
│   │   └── PolygonZkEVMBridge.ts      # Bridge contract types
│   │
│   └── enums/
│       ├── leaf_type.ts               # ASSET vs MESSAGE
│       └── metadata_fields.ts         # Metadata field names
│
├── tests/                             # Test files
├── dist/                              # Built output
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── claude.md                          # This file
```

## Core Components

### Consumers

#### bridge_api_consumer.ts

**Purpose**: Fetches new bridge transactions from Aggkit Bridge Service

**Key functions**:

- `consumeBridgeTransactions()` - Main polling loop
- Fetches transactions from Bridge Service API
- Maps external format to internal `BridgeTransaction`
- Stores new transactions in MongoDB
- Updates existing transactions

**Flow**:

1. Fetch latest transactions from Bridge Service
2. For each transaction:
    - Check if exists in MongoDB
    - If new: insert
    - If exists: update with latest data
3. Store token mappings
4. Sleep and repeat

**Environment variables**:

- `BRIDGE_SERVICE_URL` - Aggkit Bridge Service endpoint
- `NETWORK_ID` - Network to monitor
- `POLLING_INTERVAL` - How often to poll (ms)

#### claim_readiness_consumer.ts

**Purpose**: Updates transaction status based on claim readiness

**Key functions**:

- `consumeClaimReadiness()` - Main checking loop
- Queries transactions with status BRIDGED
- Checks if Merkle proof is available
- Updates status to READY_TO_CLAIM when proof exists

**Flow**:

1. Fetch BRIDGED transactions from MongoDB
2. For each transaction:
    - Query Bridge Service for Merkle proof
    - If proof available: update status to READY_TO_CLAIM
3. Sleep and repeat

**Status transitions**:

```
BRIDGED → READY_TO_CLAIM (when proof available)
```

### Services (Database Layer)

#### services/transaction.ts

**Purpose**: Database operations for bridge transactions

**Key functions**:

- `saveTransaction(tx)` - Insert or update transaction
- `getTransactionByDepositCount(count)` - Find by ID
- `updateTransactionStatus(count, status)` - Update status
- `getTransactionsByStatus(status)` - Query by status

**Database**: MongoDB collection `bridge_transactions`

**Indexes** (should exist):

- `depositCount` (unique)
- `status`
- `sourceNetwork`
- `destinationNetwork`
- `timestamp`

#### services/mapping.ts

**Purpose**: Database operations for token mappings

**Key functions**:

- `saveMapping(mapping)` - Insert or update mapping
- `getMappingByNetworks(origin, dest, tokenAddr)` - Find mapping
- `getAllMappings()` - List all mappings

**Database**: MongoDB collection `token_mappings`

#### services/metadata.ts

**Purpose**: Metadata extraction and storage

**Key functions**:

- `extractMetadata(tx)` - Parse transaction metadata
- `saveMetadata(txId, metadata)` - Store metadata

**Database**: Embedded in transaction documents

### Mappers (Data Transformation)

#### mappers/transaction.ts

**Purpose**: Transform Bridge Service API data to internal `BridgeTransaction` format

**Key functions**:

- `mapBridgeTransaction(apiTx)` - Main mapper
- Converts field names (API → internal)
- Parses timestamps
- Decodes metadata
- Transforms addresses to checksummed format

**Handles**:

- Different field naming conventions
- Type conversions (string → BigInt, etc.)
- Nested object flattening
- Default values for missing fields

#### mappers/mapping.ts

**Purpose**: Extract and format token mappings

**Key functions**:

- `extractTokenMapping(tx)` - Extract from transaction
- Handles origin/destination network pairing
- Ensures proper address formatting

#### mappers/metadata.ts

**Purpose**: Parse and format metadata

**Key functions**:

- `parseMetadata(raw)` - Parse raw metadata bytes
- `decodeMessage(data)` - Decode MESSAGE leaf data
- Handles different metadata formats (ASSET vs MESSAGE)

### Interfaces

**Key types**:

#### bridge_api_result.ts

```typescript
interface BridgeAPIResult {
	deposits: BridgeTx[]; // Bridge transactions from API
	total_cnt: string; // Total count
}
```

#### bridge_tx.ts

```typescript
interface BridgeTx {
	deposit_cnt: number;
	orig_net: number;
	dest_net: number;
	// ... API-specific field names
}
```

#### claim_tx.ts

```typescript
interface ClaimTx {
	tx_hash: string;
	block_num: string;
	network_id: number;
	// ... Claim-specific fields
}
```

#### decoded_global_index.ts

```typescript
interface DecodedGlobalIndex {
	mainnetFlag: boolean;
	rollupIndex: number;
	leafIndex: number;
}
```

Used for parsing `globalIndex` field to determine claim requirements.

### Enums

#### leaf_type.ts

```typescript
export enum LeafType {
	ASSET = 0, // Token transfer
	MESSAGE = 1, // Cross-chain message
}
```

Determines transaction type and claim behavior.

#### metadata_fields.ts

```typescript
export enum MetadataFields {
	ORIGIN_ADDRESS = "originAddress",
	DESTINATION_ADDRESS = "destinationAddress",
	// ... Other metadata fields
}
```

Standardized metadata field names.

## Configuration

**Environment variables** (`src/config.ts`):

**Required**:

- `BRIDGE_SERVICE_URL` - Aggkit Bridge Service API endpoint
    - Example: `https://bridge-api.polygon.technology`
- `NETWORK_ID` - Network ID to monitor
    - Example: `1` (mainnet), `2` (specific rollup)
- `MONGODB_URI` - MongoDB connection string
    - Example: `mongodb://localhost:27017/bridge_hub`

**Optional**:

- `POLLING_INTERVAL` - Polling frequency in ms (default: 30000)
- `CLAIM_CHECK_INTERVAL` - Claim readiness check interval (default: 60000)
- `BATCH_SIZE` - Transactions per batch (default: 100)
- `SENTRY_DSN` - Error tracking (optional)

## Data Flow

### New Transaction Flow

```
1. Bridge Service API
         ↓
2. bridge_api_consumer fetches
         ↓
3. mappers/transaction transforms
         ↓
4. services/transaction saves
         ↓
5. MongoDB (status: BRIDGED)
```

### Claim Readiness Flow

```
1. MongoDB (status: BRIDGED)
         ↓
2. claim_readiness_consumer fetches
         ↓
3. Query Bridge Service for proof
         ↓
4. If proof exists:
   services/transaction updates
         ↓
5. MongoDB (status: READY_TO_CLAIM)
```

## Running the Consumer

### Development

```bash
cd packages/consumer
bun run dev  # Hot reload enabled
```

### Production

```bash
cd packages/consumer
bun run build
bun start  # Runs dist/index.js
```

### Docker

```bash
# From root
docker build -f Dockerfile.consumer -t consumer .
docker run --env-file .env consumer
```

## Common Development Tasks

### Adding a New Field to Transactions

1. **Update commons interface**:

    ```typescript
    // packages/commons/src/interfaces/bridge_transaction.ts
    export interface BridgeTransaction {
    	// ... existing fields
    	newField: string; // Add field
    }
    ```

2. **Update mapper**:

    ```typescript
    // packages/consumer/src/mappers/transaction.ts
    export function mapBridgeTransaction(apiTx: BridgeTx): BridgeTransaction {
    	return {
    		// ... existing mappings
    		newField: apiTx.new_field || "default",
    	};
    }
    ```

3. **Update database service** (if needed):

    ```typescript
    // packages/consumer/src/services/transaction.ts
    // Update queries/projections if field needs special handling
    ```

4. **Type check**:
    ```bash
    cd ../../  # Root
    bun run type-check
    ```

### Adding a New Consumer

1. **Create consumer file**:

    ```typescript
    // packages/consumer/src/my_new_consumer.ts
    export async function consumeMyData() {
    	while (true) {
    		// Fetch data
    		// Transform data
    		// Store data
    		await sleep(INTERVAL);
    	}
    }
    ```

2. **Register in entry point**:

    ```typescript
    // packages/consumer/src/index.ts
    import { consumeMyData } from "./my_new_consumer.js";

    Promise.all([
    	consumeBridgeTransactions(),
    	consumeClaimReadiness(),
    	consumeMyData(), // Add here
    ]);
    ```

3. **Add tests**:
    ```typescript
    // packages/consumer/tests/my_new_consumer.test.ts
    ```

### Debugging Transaction Mapping

1. **Add logging**:

    ```typescript
    // mappers/transaction.ts
    import logger from "@polygonlabs/servercore";

    logger.info("Mapping transaction", { apiTx, mapped });
    ```

2. **Check raw API response**:

    ```bash
    curl "$BRIDGE_SERVICE_URL/api/v1/deposits?network_id=$NETWORK_ID"
    ```

3. **Verify MongoDB document**:
    ```javascript
    // MongoDB shell
    db.bridge_transactions.findOne({ depositCount: 12345 });
    ```

## Error Handling

### Common Errors

**Error**: `Failed to fetch from Bridge Service`

- **Cause**: Bridge Service unreachable
- **Solution**: Check `BRIDGE_SERVICE_URL`, network connectivity

**Error**: `MongoDB connection failed`

- **Cause**: Database not running or wrong URI
- **Solution**: Check `MONGODB_URI`, ensure MongoDB is running

**Error**: `Invalid transaction format`

- **Cause**: Bridge Service API changed
- **Solution**: Update mappers to handle new format

**Error**: `Duplicate key error`

- **Cause**: Trying to insert existing transaction
- **Solution**: Use upsert instead of insert in services

### Retry Logic

Consumers have built-in retry logic:

- Network errors → retry after delay
- Rate limiting → exponential backoff
- Transient errors → log and continue

**Fatal errors** (stop consumer):

- Invalid configuration
- Incompatible Bridge Service version
- MongoDB schema mismatch

## Performance Considerations

### Indexing

**Critical indexes**:

```javascript
// MongoDB indexes for optimal performance
db.bridge_transactions.createIndex({ depositCount: 1 }, { unique: true });
db.bridge_transactions.createIndex({ status: 1 });
db.bridge_transactions.createIndex({ sourceNetwork: 1, destinationNetwork: 1 });
db.bridge_transactions.createIndex({ timestamp: -1 });
```

### Batch Processing

Consumer processes transactions in batches:

- Default: 100 transactions per batch
- Configurable via `BATCH_SIZE` env var
- Larger batches = faster indexing, more memory

### Polling Intervals

- `POLLING_INTERVAL`: 30s default (adjust based on network activity)
- `CLAIM_CHECK_INTERVAL`: 60s default (slower, less critical)

Shorter intervals = more up-to-date data, more API calls

## Testing

### Running Tests

```bash
cd packages/consumer
bun test
```

### Test Structure

- `tests/services/*.test.ts` - Database service tests
- `tests/mappers/*.test.ts` - Data transformation tests
- `tests/consumers/*.test.ts` - Consumer logic tests
- `tests/test-utils.ts` - Mock helpers

### Mocking

**MongoDB**:

```typescript
// test-utils.ts
export const mockDb = {
	collection: () => ({
		findOne: vi.fn(),
		insertOne: vi.fn(),
		updateOne: vi.fn(),
	}),
};
```

**Bridge Service API**:

```typescript
// Mock fetch responses
global.fetch = vi.fn(() =>
	Promise.resolve({
		json: () => Promise.resolve(mockBridgeApiResult),
	})
);
```

## Monitoring

### Logs

Consumer uses structured logging:

```typescript
logger.info("Transaction indexed", { depositCount, status });
logger.error("Failed to fetch", { error, url });
```

**Key log events**:

- `Transaction indexed` - New transaction stored
- `Status updated` - Transaction status changed
- `Mapping saved` - Token mapping stored
- `Error fetching` - API error
- `Database error` - MongoDB error

### Metrics

Monitor these:

- Transactions indexed per hour
- Claim readiness update lag
- API error rate
- Database query performance

### Health Checks

Consumer exposes no HTTP endpoints. Monitor via:

- Process status (running/stopped)
- Log output
- MongoDB query recency

## Troubleshooting

### Issue: Consumer not indexing new transactions

**Check**:

1. Bridge Service URL correct and accessible
2. Network ID matches target network
3. MongoDB connection working
4. Check logs for errors

### Issue: Transactions stuck in BRIDGED status

**Check**:

1. `claim_readiness_consumer` is running
2. Merkle proofs actually available (query Bridge Service manually)
3. `CLAIM_CHECK_INTERVAL` not too long

### Issue: High memory usage

**Solution**:

- Reduce `BATCH_SIZE`
- Optimize mapper functions (avoid large object copies)
- Check for memory leaks in services

## Related Documentation

- **Root claude.md**: Overall architecture
- **packages/commons/claude.md**: Shared types used here
- **packages/api/claude.md**: API that consumes indexed data
- **DEPLOYMENT.md**: Production deployment guide

## Key Takeaways

1. Consumer is the **data ingestion layer** - it's the source of truth
2. It runs **continuously** as a daemon
3. **Two main loops**: bridge indexing + claim readiness checking
4. Uses **mappers** to transform external data to internal format
5. All data flows through **services** to MongoDB
6. Status transitions: `BRIDGED → READY_TO_CLAIM`
7. Proper **indexing** is critical for performance
