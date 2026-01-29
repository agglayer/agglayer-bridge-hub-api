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
┌──────────────────────────────────────────────────────────────────┐
│                       External Systems                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Aggkit     │  │  Blockchain  │  │   MongoDB    │            │
│  │    Bridge    │  │              │  │   Database   │            │
│  │   service    │  │              │  │              │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
└─────────┼─────────────────┼─────────────────┼────────────────────┘
          │                 │                 │
          ▼                 ▼                 ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Bridge Hub Packages                           │
│                                                                  │
│                    ┌───────────────┐                             │
│                    │    COMMONS    │                             │
│                    │ (Shared Types)│                             │
│                    └───────┬───────┘                             │
│                            │                                     │
│              ┌─────────────┼─────────────┐                       │
│              │             │             │                       │
│              ▼             ▼             ▼                       │
│      ┌──────────┐    ┌─────────┐   ┌───────────┐                 │
│      │ CONSUMER │    │   API   │   │AUTO-CLAIM │                 │
│      │ (Indexer)│    │(Service)│   │(Claimer)  │                 │
│      └─────┬────┘    └────┬────┘   └─────┬─────┘                 │
│            │              │              │                       │
│            │ Writes       │ Reads        │ HTTP                  │
│            ▼              ▼              ▼                       │
│      ┌──────────────────────────┐   ┌─────────────┐              │
│      │    MongoDB Database      │   │ Blockchain  │              │
│      └──────────────────────────┘   └─────────────┘              │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Production Cluster Architecture

### Multi-Network Deployment

The Bridge Hub is designed to index multiple blockchain networks simultaneously. Each network connected to the Agglayer has a unique network ID (e.g., 0 for Ethereum, 1 for zkEVM, etc.). The production deployment runs **one consumer instance per source network** to index bridge transactions.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AGGLAYER HUB API CLUSTER                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐        ┌─────────────────────────────────┐                  │
│  │   Aggkit    │        │      netId_0 Consumer           │                  │
│  │   Bridge    │──────▶ │  ┌───────────────────────────┐  │                  │
│  │  Service    │        │  │  bridgesCron              │  │                  │
│  │  (net 0)    │        │  │  claimsCron               │  │──┐               │
│  └─────────────┘        │  │  readyToClaimCron         │  │  │               │
│                         │  │  mappingsCron             │  │  │               │
│                         │  └───────────────────────────┘  │  │               │
│                         └─────────────────────────────────┘  │               │
│                                                              │               │
│  ┌─────────────┐        ┌─────────────────────────────────┐  │               │
│  │   Aggkit    │        │      netId_1 Consumer           │  │               │
│  │   Bridge    │──────▶ │  ┌───────────────────────────┐  │  │               │
│  │  Service    │        │  │  bridgesCron              │  │  │               │
│  │  (net 1)    │        │  │  claimsCron               │  │──┤               │
│  └─────────────┘        │  │  readyToClaimCron         │  │  │               │
│                         │  │  mappingsCron             │  │  │               │
│                         │  └───────────────────────────┘  │  │               │
│                         └─────────────────────────────────┘  │               │
│                                                              │               │
│  ┌─────────────┐        ┌─────────────────────────────────┐  │               │
│  │   Aggkit    │        │      netId_n Consumer           │  │               │
│  │   Bridge    │──────▶ │  ┌───────────────────────────┐  │  │               │
│  │  Service    │        │  │  bridgesCron              │  │  │               │
│  │  (net n)    │        │  │  claimsCron               │  │──┤               │
│  └─────────────┘        │  │  readyToClaimCron         │  │  │               │
│                         │  │  mappingsCron             │  │  │               │
│                         │  └───────────────────────────┘  │  │               │
│                         └─────────────────────────────────┘  │               │
│                                                              │               │
│                                                              ▼               │
│                         ┌────────────────────────────────────────────┐       │
│                         │         MongoDB Database                   │       │
│                         │  ┌──────────────────────────────────────┐  │       │
│                         │  │  Collections (per environment):      │  │       │
│                         │  │  • bridge_hub_api_transactions       │  │       │
│                         │  │  • bridge_hub_api_mappings           │  │       │
│                         │  │  • bridge_hub_api_metadata           │  │       │
│                         │  └──────────────────────────────────────┘  │       │
│                         └────────────┬───────────────────────────────┘       │
│                                      │                                       │
│                                      ▼ Reads from                            │
│                         ┌────────────────────────────────────────────┐       │
│                         │         API Service                        │       │
│                         │  ┌──────────────────────────────────────┐  │       │
│                         │  │  /transactions                       │  │       │
│                         │  │  /token-mappings                     │  │       │
│                         │  │  /token-metadata                     │  │       │
│                         │  │  /claim-proof (proxies to Aggkit)    │  │───┐   │
│                         │  └──────────────────────────────────────┘  │   │   │
│                         └────────────────────────────────────────────┘   │   │
│                                                                          │   │
│                                                              HTTP Calls  │   │
│                         ┌─────────────────────────────────────────────┐  │   │
│                         │     Auto-Claim Service (per dest network)   │◀─┘   │
│                         │  ┌──────────────────────────────────────┐   │      │
│                         │  │  Polls /transactions                 │   │      │
│                         │  │  Fetches /claim-proof                │   │      │
│                         │  │  Submits claims to blockchain        │   │      │
│                         │  └──────────────────────────────────────┘   │      │
│                         └─────────────────────────────────────────────┘      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Key Architecture Points:**

1. **Consumer Instances**: One per source network being indexed (netId_0, netId_1, etc.)
2. **Naming Convention**: `netId_X` is a generalized naming; actual network IDs are 0=Ethereum, 1=zkEVM, etc.
3. **Shared Database**: All consumers write to the same MongoDB instance
4. **Single API**: One API service reads from the database and serves all networks
5. **Auto-Claim Deployment**: One instance per destination network you want to auto-claim for

### Aggkit Bridge Service

Each blockchain network connected to the Agglayer operates its own **Aggkit Bridge Service**:

- **Ownership**: Maintained by the chain operators (not part of Bridge Hub deployment)
- **Purpose**: Monitors blockchain events and indexes bridge-related data
- **Interface**: Exposes APIs for bridge transactions, claims, mappings, and L1 info tree data
- **Consumer Connection**: Each Bridge Hub consumer connects to the corresponding chain's Aggkit service

**Important**: The consumer does NOT directly monitor the blockchain. Instead, it polls the Aggkit Bridge Service APIs to fetch indexed data.

### Component Responsibilities

| Component      | Layer          | Responsibility                            |
| -------------- | -------------- | ----------------------------------------- |
| **Commons**    | Foundation     | Shared types, interfaces, schemas         |
| **Consumer**   | Data Ingestion | Monitor blockchain, index transactions    |
| **API**        | Service        | Expose bridge tx data, serve claim-proofs |
| **Auto-Claim** | Automation     | Automatically claim ready transactions    |

### Consumer Internal Architecture

The Consumer package consists of two main components that run within a single Node.js process:

#### BridgeAPIConsumer

Contains three cron jobs that fetch data from the Aggkit Bridge Service:

**1. bridgesCron**

- **Purpose**: Fetches new bridge deposit transactions
- **Data Source**: Polls Aggkit Bridge Service API for bridge events
- **Database Action**: Inserts new transactions into `transactions` collection with status `BRIDGED`
- **Metadata Tracking**: Updates `lastIndexedBridgeDepositCount` in metadata collection

**2. claimsCron**

- **Purpose**: Fetches claim events that occurred on the blockchain
- **Data Source**: Polls Aggkit Bridge Service API for claim events
- **Database Action**: Updates transactions in `transactions` collection to status `CLAIMED`, adds `claimTransactionHash` and timestamp
- **Metadata Tracking**: Updates `lastIndexedClaimBlockNumber` in metadata collection

**3. mappingsCron**

- **Purpose**: Fetches token mapping events on the chain
- **Data Source**: Polls Aggkit Bridge Service API for tokenMapping events
- **Database Action**: Inserts/updates token mappings in `mappings` collection
- **Metadata Tracking**: Updates `lastIndexedMappingBlockNumber` in metadata collection

#### ClaimReadinessConsumer

Contains one cron job:

**4. readyToClaimCron**

- **Purpose**: Determines when transactions become claimable
- **Data Source**: Polls Aggkit Bridge Service API for L1 info tree updates
- **Database Action**: Updates transactions from `BRIDGED` to `READY_TO_CLAIM` status, sets `leafIndexForProof`
- **Logic**: Compares L1 info tree data with transaction data to determine claim readiness

#### Data Flow

```
Aggkit Bridge Service (per network)
    │
    ├── /bridges API ────▶ bridgesCron ────▶ transactions collection (BRIDGED)
    │
    ├── /claims API ─────▶ claimsCron ─────▶ transactions collection (CLAIMED)
    │
    ├── /mappings API ───▶ mappingsCron ───▶ mappings collection
    │
    └── /l1-info-tree ───▶ readyToClaimCron ▶ transactions collection (READY_TO_CLAIM)
```

**Key Points:**

- All 4 crons run in a single Node.js process per network
- Crons are scheduled jobs that run at configured intervals
- Consumer does NOT directly monitor blockchain - it polls Aggkit APIs
- Metadata collection tracks indexing progress for resume capability after restarts

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
│ Consumer         │  ← Polls transactions in Bridged status
└────────┬─────────┘     every 10s and updates the status
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
│ Middleware   │  ← CORS, input validation, logging, error handling
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Controller   │  ← Routing request to corresponding service and response formatting
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Service     │  ← Business logic
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
   ClaimReadinessConsumer polls txs in bridged status
   → Detects L1 info tree update
   → Updates transaction (status: READY_TO_CLAIM)
   → Sets leafIndex and leafIndexForProof

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

## Database Architecture

### Shared Database Model

The Bridge Hub uses a **single shared MongoDB instance** across all network indexers and the API service. This centralized database approach simplifies operations while supporting horizontal scaling through replica sets.

**Deployment Options:**

- **Single Instance**: For development or low-traffic deployments
- **Replica Set**: For high availability and read scaling in production
- **Sharding**: Optional for very high transaction volumes (shard by network or date)

### Collection Structure

Collections are organized by environment, using the naming convention:

```
bridge_hub_api_[type]_[environment]
```

**Environments:**

- No suffix: Mainnet/production data
- `_testnet`: Testnet data
- `_devnet`: Development network data

**Collection Types:**

#### 1. Transactions Collections

```
bridge_hub_api_transactions
bridge_hub_api_transactions_testnet
bridge_hub_api_transactions_devnet
```

- **Purpose**: Store all bridge transactions across all networks
- **Modified By**: `bridgesCron` (upserts), `claimsCron` (updates), `readyToClaimCron` (updates)
- **Key Fields**: `hubUID`, `sourceNetwork`, `destinationNetwork`, `status`, `depositCount`
- **Status Values**: `BRIDGED` → `LEAF_INCLUDED` → `READY_TO_CLAIM` → `CLAIMED`

#### 2. Mappings Collections

```
bridge_hub_api_mappings
bridge_hub_api_mappings_testnet
bridge_hub_api_mappings_devnet
```

- **Purpose**: Store token address mappings between Agglayer networks
- **Modified By**: `mappingsCron` (inserts/updates)
- **Key Fields**: `originNetwork`, `originTokenAddress`, `wrappedTokenAddress`, `destinationNetwork`

#### 3. Metadata Collections

```
bridge_hub_api_metadata
bridge_hub_api_metadata_testnet
bridge_hub_api_metadata_devnet
```

- **Purpose**: Track indexing progress per network for resume capability
- **Modified By**: All cron jobs (update their respective checkpoint)
- **Document per Network**: One document per `NETWORK_ID` being indexed

**Metadata Document Schema:**

```javascript
{
  _id: "lastIndexedTransactions",           // Document ID
  networkId: 0,                             // Network being indexed (0, 1, etc.)
  lastIndexedBridgeDepositCount: 12345,     // Resume point for bridgesCron
  lastIndexedClaimBlockNumber: 5678900,     // Resume point for claimsCron
  lastIndexedMappingBlockNumber: 5678900,   // Resume point for mappingsCron
  lastUpdated: ISODate("2024-01-27T10:00:00Z")
}
```

### Why Metadata is Critical

When a consumer instance restarts (planned maintenance, crash, deployment), it needs to know where to resume indexing. Without metadata:

- **Problem**: Consumer would re-index from genesis block (hours/days of duplicate work)
- **Solution**: Consumer reads metadata collection to find last indexed position
- **Behavior**: Each cron job queries its checkpoint field and resumes from that point

**Example Resume Flow:**

1. Consumer starts for network 1 (zkEVM)
2. `bridgesCron` reads `lastIndexedBridgeDepositCount` → resumes from deposit #12346
3. `claimsCron` reads `lastIndexedClaimBlockNumber` → resumes from block #5678901
4. `mappingsCron` reads `lastIndexedMappingBlockNumber` → resumes from block #5678901

### Database Access Patterns

**Consumers (Write-Heavy):**

- Upserts new transactions (bridgesCron)
- Update transaction status (claimsCron, readyToClaimCron)
- Upsert token mappings (mappingsCron)
- Update metadata checkpoints (all crons)

**API (Read-Heavy):**

- Query transactions by status, network, filters
- Query token mappings by network and address
- Generate proofs (proxied to Aggkit, not from DB)

**Auto-Claim (Read-Only via API):**

- No direct database access
- Calls API endpoints over HTTP

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
  bridgeHash: String,

  // Bridge Details
  leafType: String,                    // "ASSET" or "MESSAGE"
  originTokenNetwork: Number,
  originTokenAddress: String,
  receiverAddress: String,
  fromAddress: String,
  amount: String,                      // BigInt as string
  depositCount: Number,                // Deposit counter

  // Claiming Details
  leafIndexForProof: Number,           // Index for merkle proof
  globalIndex: String,                 // Global index as string

  // Status Tracking
  status: String,                      // BRIDGED, LEAF_INCLUDED, READY_TO_CLAIM, CLAIMED
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
  _id: String,                                // Document type identifier
  lastIndexedBridgeDepositCount: Number,      // Last indexed deposit count
  lastIndexedClaimBlockNumber: Number         // Last indexed claim block number
  lastIndexedMappingBlockNumber: Number       // Last indexed mappings block number
}
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

### Proof Generation

The API proxies merkle proofs for claiming from the respective Aggkit instances:

**Inputs**:

- `sourceNetworkId`: Source chain ID
- `depositCount`: Deposit counter value
- `leafIndex`: Leaf index for proof in merkle tree

**Process**:

1. Fetch transaction data from source chain for metadata
2. Proxy claim proofs from the source chain's Aggkit proof endpoint

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

> **Note**: For security vulnerability reporting and Polygon's bug bounty program, see [SECURITY.md](./SECURITY.md).

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
2. **Proof Generation**: Computation simplified with proxying proof from Aggkit

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

**Decision**: Simplicity and reliability are more important. Can introduce batch processing in future.

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
GET /health-check
{
  "status": "success",
  "data": {
    "status": "success",
    "message": "All services are working correctly"
  }
}
```

## Conclusion

The Agglayer Bridge Hub architecture provides a robust, scalable solution for bridge transaction management. The separation of concerns, clear data flow, and comprehensive error handling ensure system reliability and maintainability.

For deployment details, see [DEPLOYMENT.md](./DEPLOYMENT.md).

For contributing guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).
