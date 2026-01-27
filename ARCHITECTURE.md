# Architecture Documentation

This document provides a comprehensive overview of the Agglayer Bridge Hub architecture, design decisions, and system internals.

## Table of Contents

- [System Overview](#system-overview)
- [Package Architecture](#package-architecture)
- [Data Flow](#data-flow)
- [Database Design](#database-design)
- [API Design](#api-design)
- [Security Architecture](#security-architecture)
- [Scalability Considerations](#scalability-considerations)
- [Design Decisions](#design-decisions)

## System Overview

The Agglayer Bridge Hub is a microservices-based system designed to facilitate cross-chain bridge transactions. It consists of four main packages that work together to monitor, index, expose, and automatically claim bridge transactions.

### High-Level Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                       External Systems                              │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Bridge     │  │  Blockchain  │  │   MongoDB    │            │
│  │  Service API │  │   (Aggkit)   │  │   Database   │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼──────────────────┼──────────────────┼────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌────────────────────────────────────────────────────────────────────┐
│                    Bridge Hub Packages                              │
│                                                                     │
│                    ┌───────────────┐                               │
│                    │    COMMONS    │                               │
│                    │  (Shared Types)│                               │
│                    └───────┬───────┘                               │
│                            │                                        │
│              ┌─────────────┼─────────────┐                         │
│              │             │             │                         │
│              ▼             ▼             ▼                         │
│      ┌──────────┐    ┌─────────┐   ┌───────────┐                │
│      │ CONSUMER │    │   API   │   │AUTO-CLAIM │                │
│      │ (Indexer)│    │(Service)│   │(Claimer)  │                │
│      └─────┬────┘    └────┬────┘   └─────┬─────┘                │
│            │              │              │                         │
│            │ Writes       │ Reads        │ HTTP                   │
│            ▼              ▼              ▼                         │
│      ┌──────────────────────────┐   ┌─────────────┐             │
│      │    MongoDB Database      │   │ Blockchain  │             │
│      └──────────────────────────┘   │ (Claims)    │             │
│                                      └─────────────┘             │
└────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component      | Layer          | Responsibility                           |
| -------------- | -------------- | ---------------------------------------- |
| **Commons**    | Foundation     | Shared types, interfaces, schemas        |
| **Consumer**   | Data Ingestion | Monitor blockchain, index transactions   |
| **API**        | Service        | Expose transaction data, generate proofs |
| **Auto-Claim** | Automation     | Automatically claim ready transactions   |

## Package Architecture

### 1. Commons Package

**Purpose**: Type-safe contracts between packages

```
@agglayer/bridge-hub-commons
├── interfaces/          # TypeScript interfaces
│   ├── bridge_transaction.ts
│   ├── transaction_document.ts
│   ├── proof.ts
│   └── ...
├── enums/              # Enumeration types
│   └── transaction_status.ts
└── index.ts            # Main export
```

**Key Patterns**:

- Pure TypeScript types (no runtime code)
- Interface segregation (small, focused interfaces)
- Shared across all packages via workspace dependency

**Design Decision**: Centralizing types prevents inconsistencies and reduces maintenance overhead.

### 2. Consumer Package

**Purpose**: Event-driven blockchain indexer

```
bridge-hub-consumer
├── src/
│   ├── bridge_api_consumer.ts     # Polls Bridge Service API
│   ├── claim_readiness_consumer.ts # Monitors blockchain
│   ├── services/                  # Data access layer
│   │   ├── transaction.ts
│   │   ├── mapping.ts
│   │   └── metadata.ts
│   ├── mappers/                   # Data transformation
│   └── interfaces/                # Local type definitions
```

**Architecture Pattern**: Event-Driven with Polling

```
┌──────────────────┐
│  BridgeAPI       │
│  Consumer        │  ← Poll every 10s
└────────┬─────────┘
         │
         ▼
    ┌────────────┐
    │  MongoDB   │
    │  (Write)   │
    └────────────┘

┌──────────────────┐
│ ClaimReadiness   │
│ Consumer         │  ← Listen for events
└────────┬─────────┘
         │
         ▼
    ┌────────────┐
    │  MongoDB   │
    │  (Update)  │
    └────────────┘
```

**Key Patterns**:

- **Polling**: Bridge API Consumer uses time-based polling
- **Event Listening**: Claim Readiness Consumer listens to blockchain events
- **Idempotent Writes**: Uses upsert operations to handle duplicate events
- **Cursor-Based Pagination**: Tracks `depositCount` to avoid reprocessing

**Design Decision**: Separate consumers allow independent scaling and failure isolation.

### 3. API Package

**Purpose**: RESTful API with OpenAPI documentation

```
bridge-hub-api
├── src/
│   ├── server.ts           # Application entry point
│   ├── routes/             # Route definitions
│   │   ├── transactions.ts
│   │   ├── proof.ts
│   │   └── index.ts
│   ├── controllers/        # Request handling
│   ├── services/           # Business logic
│   │   ├── transactions.ts
│   │   ├── proof.ts
│   │   ├── mappings.ts
│   │   └── token_metadata.ts
│   ├── schemas/            # Zod validation schemas
│   └── middlewares/        # Custom middleware
```

**Architecture Pattern**: Layered Architecture

```
Request
  │
  ▼
┌──────────────┐
│   Router     │  ← Route matching
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Middleware   │  ← CORS, logging, error handling
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controller   │  ← Input validation, response formatting
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Service     │  ← Business logic, proof generation
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  MongoDB     │  ← Data persistence
└──────────────┘
```

**Key Patterns**:

- **OpenAPI-First**: Routes defined with Zod schemas for automatic validation
- **Cursor-Based Pagination**: Uses `startAfter` for consistent results
- **Stateless Design**: No session state, horizontally scalable
- **Structured Errors**: Consistent error response format

**Design Decision**: Layered architecture provides clear separation of concerns and testability.

### 4. Auto-Claim Package

**Purpose**: Automated transaction claiming

```
auto-claim-service
├── src/
│   ├── index.ts                 # Entry point with polling loop
│   ├── services/
│   │   ├── auto-claim.ts        # Claiming orchestration
│   │   └── transaction.ts       # API client
│   └── constants/
│       └── bridge.ts            # Bridge contract ABI
```

**Architecture Pattern**: Polling with State Machine

```
        ┌─────────────────┐
        │  Poll API       │
        │  (30s interval) │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Filter Txs      │
        │ (Remove 0-amount)│
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ For Each Tx:    │
        │ 1. Get Proof    │
        │ 2. Compute Index│
        │ 3. Submit Claim │
        │ 4. Wait Confirm │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │  Sleep 30s      │
        └────────┬────────┘
                 │
                 └──────→ (repeat)
```

**Key Patterns**:

- **Sequential Processing**: Claims processed one at a time to avoid nonce issues
- **Error Isolation**: Errors on one transaction don't affect others
- **Confirmation Waiting**: Always waits for transaction confirmation
- **Idempotent**: Safe to run multiple times (blockchain enforces uniqueness)

**Design Decision**: Sequential processing is simpler and safer than parallel processing with nonce management.

## Data Flow

### Complete Transaction Lifecycle

```
1. USER ACTION
   User bridges tokens from L1 → L2

   ▼

2. CONSUMER: Initial Indexing
   BridgeAPIConsumer polls Bridge Service API
   → Fetches new transaction
   → Maps to IHubTransaction
   → Saves to MongoDB (status: BRIDGED)

   ▼

3. CONSUMER: Claim Readiness Detection
   ClaimReadinessConsumer listens to blockchain events
   → Detects L1 info tree update
   → Updates transaction (status: READY_TO_CLAIM)
   → Sets leafIndexForProof

   ▼

4. API: Data Exposure
   API exposes transaction via GET /transactions
   → Filters by status=READY_TO_CLAIM
   → Returns transaction with pagination

   ▼

5. AUTO-CLAIM: Discovery
   AutoClaimService polls API
   → GET /transactions?status=READY_TO_CLAIM
   → Finds claimable transaction

   ▼

6. AUTO-CLAIM: Proof Fetching
   AutoClaimService fetches proof
   → GET /claim-proof?sourceNetworkId=X&depositCount=Y&leafIndex=Z
   → Receives merkle proof

   ▼

7. AUTO-CLAIM: Transaction Submission
   AutoClaimService submits claim
   → Computes global index
   → Calls bridge.claimAsset() or bridge.claimMessage()
   → Waits for confirmation

   ▼

8. CONSUMER: Claim Detection
   ClaimReadinessConsumer detects claim event
   → Updates transaction (status: CLAIMED)
   → Saves claim transaction hash
   → Updates claim timestamp
```

### Data Synchronization

The system maintains eventual consistency through event-driven updates:

- **Write Path**: Consumer → MongoDB
- **Read Path**: API ← MongoDB
- **Claim Path**: Auto-Claim → Blockchain

**Consistency Guarantees**:

- Transactions are immutable once created
- Status updates are atomic
- Duplicate events are handled via upsert
- No distributed transactions needed

## Database Design

### MongoDB Schema

#### Transactions Collection

```javascript
{
  _id: ObjectId,                       // MongoDB primary key
  hubUID: String (unique),             // Business key

  // Network Information
  sourceNetwork: Number,               // Source chain ID
  destinationNetwork: Number,          // Destination chain ID

  // Transaction Details
  transactionHash: String,             // Source transaction hash
  blockNumber: Number,                 // Block number on source
  timestamp: Number,                   // Unix timestamp

  // Bridge Details
  leafType: String,                    // "ASSET" or "MESSAGE"
  originTokenNetwork: Number,
  originTokenAddress: String,
  receiverAddress: String,
  fromAddress: String,
  amount: String,                      // BigInt as string

  // Claiming Details
  depositCount: Number,                // Deposit counter
  leafIndexForProof: Number,           // Index for merkle proof
  globalIndex: String,                 // Global index as string
  bridgeHash: String,

  // Status Tracking
  status: String,                      // BRIDGED, READY_TO_CLAIM, CLAIMED
  lastUpdatedAt: Number,               // Last update timestamp

  // Claim Information (populated after claim)
  claimTransactionHash: String,
  claimBlockNumber: Number,
  claimTimestamp: Number
}
```

**Indexes**:

```javascript
{
  hubUID: 1                            // Unique index
  status: 1,                           // Query by status
  { sourceNetwork: 1, destinationNetwork: 1 },  // Filter by networks
  depositCount: 1,                     // Order by deposit count
  { status: 1, destinationNetwork: 1 } // Combined index for common queries
}
```

#### Token Mappings Collection

```javascript
{
  _id: ObjectId,
  originNetwork: Number,
  originTokenAddress: String,
  wrappedTokenAddress: String,
  destinationNetwork: Number,
  // ... metadata fields
}
```

#### Metadata Collection

```javascript
{
  _id: String,                         // Document type identifier
  lastDepositCount: Number,            // Last indexed deposit count
  lastUpdated: ISODate                 // Last update timestamp
}
```

### Query Patterns

**Most Common Queries**:

1. **Get Ready to Claim Transactions**

```javascript
db.transactions
	.find({
		status: "READY_TO_CLAIM",
		destinationNetwork: { $in: [2442] },
	})
	.limit(50);
```

2. **Get Transaction by ID**

```javascript
db.transactions.findOne({
	hubUID: "unique-id",
});
```

3. **Update Transaction Status**

```javascript
db.transactions.updateOne(
	{ hubUID: "unique-id" },
	{
		$set: {
			status: "CLAIMED",
			claimTransactionHash: "0x...",
			lastUpdatedAt: Date.now(),
		},
	}
);
```

## API Design

### REST Principles

The API follows REST conventions:

- **Resources**: Transactions, proofs, mappings, metadata
- **HTTP Methods**: GET (read-only API)
- **Status Codes**: 200 (success), 400 (bad request), 404 (not found), 500 (server error)
- **Content Type**: `application/json`

### Pagination Strategy

**Cursor-Based Pagination**:

```
GET /transactions?limit=50
  → Returns first 50 transactions
  → Includes nextStartAfterCursor if more exist

GET /transactions?limit=50&startAfter=<cursor>
  → Returns next 50 transactions after cursor
```

**Benefits**:

- Stable results (no skipping/duplicates on concurrent updates)
- Efficient for large datasets
- No deep pagination performance issues

**Implementation**:

```typescript
const cursor = query.startAfter;
const transactions = await collection
	.find({
		/* filters */
	})
	.sort({ hubUID: 1 })
	.limit(limit + 1) // Fetch one extra to check if more exist
	.skip(cursor ? 1 : 0);

const hasMore = transactions.length > limit;
const results = transactions.slice(0, limit);
const nextCursor = hasMore ? results[results.length - 1].hubUID : undefined;
```

### Proof Generation

The API generates merkle proofs for claiming:

**Inputs**:

- `sourceNetworkId`: Source chain ID
- `depositCount`: Deposit counter value
- `leafIndex`: Index in merkle tree

**Process**:

1. Fetch transaction data from source chain
2. Query merkle tree for proofs
3. Fetch L1 info tree leaf
4. Construct ClaimProof object

**Output**:

```json
{
	"proof_local_exit_root": ["0x...", "0x..."],
	"proof_rollup_exit_root": ["0x...", "0x..."],
	"l1_info_tree_leaf": {
		/* L1 info */
	},
	"bridge_tx_metadata": "0x..."
}
```

## Security Architecture

### API Security

**Input Validation**:

- All inputs validated via Zod schemas
- Type safety enforced at TypeScript level
- Query parameter sanitization

**Error Handling**:

- No sensitive data in error messages
- Structured error responses
- Errors logged with context for debugging

**CORS**:

- Configurable origins
- Credentials not allowed
- Pre-flight requests supported

### Auto-Claim Security

**Private Key Management**:

- Never logged or exposed
- Loaded from environment variables
- Should use secret management systems in production

**Transaction Safety**:

- Claims are atomic (all-or-nothing)
- Blockchain enforces uniqueness (can't double-claim)
- Failed transactions don't lose funds (reverted)

**Wallet Isolation**:

- Dedicated wallet for auto-claim only
- Minimal funding (just enough for gas)
- Monitor for unusual activity

### Database Security

**Access Control**:

- Connection string in environment variables
- MongoDB authentication required
- Network isolation recommended

**Data Integrity**:

- Unique constraints on business keys
- Atomic updates for status changes
- No cascading deletes

## Scalability Considerations

### Horizontal Scaling

**API Package**:

- ✅ Stateless design
- ✅ Can run multiple instances behind load balancer
- ✅ No session state
- ✅ MongoDB connection pooling

**Consumer Package**:

- ⚠️ Run one instance per network
- ⚠️ Coordination needed for multiple instances
- ✅ Can scale by adding more networks

**Auto-Claim Package**:

- ⚠️ Sequential processing (one instance per destination)
- ⚠️ Multiple instances cause nonce conflicts
- ✅ Can scale by destination network

### Vertical Scaling

**Database**:

- Indexes for common queries
- Connection pooling
- Read replicas for API reads
- Separate write/read concerns

**Performance Bottlenecks**:

1. **MongoDB Queries**: Solved with proper indexing
2. **RPC Calls**: Solved with caching or RPC pooling
3. **Proof Generation**: Computationally expensive, consider caching

### Future Optimizations

1. **Caching Layer**: Redis for frequently accessed data
2. **Event Bus**: Replace polling with event-driven architecture
3. **Parallel Claims**: Batch multiple claims with nonce management
4. **Read Replicas**: Separate MongoDB instances for reads/writes

## Design Decisions

### Why Bun?

**Pros**:

- Fast startup time
- Built-in TypeScript support
- Native test runner
- NPM-compatible

**Cons**:

- Relatively new ecosystem
- Some packages may not work

**Decision**: Benefits outweigh risks for this project's scope.

### Why MongoDB?

**Pros**:

- Flexible schema for evolving transaction data
- Good query performance with indexes
- Easy horizontal scaling
- JSON-native (matches API responses)

**Cons**:

- No ACID transactions across documents
- Eventual consistency

**Decision**: Transaction data doesn't require strong consistency, flexible schema is beneficial.

### Why Separate Packages?

**Pros**:

- Independent deployment
- Clear boundaries
- Easier testing
- Team autonomy

**Cons**:

- More complex deployment
- Inter-package communication overhead

**Decision**: Microservices approach provides better scalability and maintainability.

### Why Sequential Claims?

**Pros**:

- Simple nonce management
- No coordination needed
- Easier error handling

**Cons**:

- Lower throughput
- Slower processing

**Decision**: Simplicity and reliability are more important than speed for claiming.

### Why Cursor-Based Pagination?

**Pros**:

- Stable results
- No deep pagination issues
- Efficient for large datasets

**Cons**:

- Can't jump to arbitrary pages
- Slightly more complex implementation

**Decision**: Stability and performance are critical for API reliability.

## Monitoring and Observability

### Logging Strategy

All packages use structured logging:

```typescript
Logger.info({
	location: "Service.method",
	action: "description",
	data: {
		/* relevant context */
	},
	duration: 123,
});
```

**Log Levels**:

- `debug`: Detailed information for debugging
- `info`: General information about system operation
- `warn`: Warning conditions
- `error`: Error conditions requiring attention

### Metrics to Track

**Consumer**:

- Transactions indexed per minute
- Time lag between bridge event and indexing
- API poll success rate
- MongoDB write latency

**API**:

- Request rate
- Response time (p50, p95, p99)
- Error rate
- Cache hit rate (if implemented)

**Auto-Claim**:

- Claims per hour
- Claim success rate
- Gas costs per claim
- Time from READY_TO_CLAIM to CLAIMED

### Health Checks

Each service should expose health endpoint:

```
GET /health
{
  "status": "healthy",
  "checks": {
    "database": "connected",
    "api": "responding"
  }
}
```

## Conclusion

The Agglayer Bridge Hub architecture provides a robust, scalable solution for bridge transaction management. The separation of concerns, clear data flow, and comprehensive error handling ensure system reliability and maintainability.

For deployment details, see [DEPLOYMENT.md](./DEPLOYMENT.md).

For contributing guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).
