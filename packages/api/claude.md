# API Package - Claude Context

## Package Overview

**Package**: `bridge-hub-api`
**Purpose**: Service layer exposing bridge data via REST API with OpenAPI documentation
**Type**: HTTP Service (web server)
**Dependencies**: `@agglayer/bridge-hub-commons`, Hono, Zod, viem
**Port**: 3000 (default)

## Role in the System

API is the **service layer** that:

1. Exposes bridge transaction data via REST endpoints
2. Generates claim proofs for ready transactions
3. Provides token metadata and mappings
4. Serves interactive OpenAPI documentation
5. Handles query validation and error responses

```
    MongoDB
       ↓
  [API Server]
       ↓
   REST API
   /transactions
   /proofs
   /mappings
   /docs
```

## Package Structure

```
packages/api/
├── src/
│   ├── server.ts                      # Main entry point, app setup
│   ├── config.ts                      # Environment configuration
│   │
│   ├── routes/                        # OpenAPI route definitions
│   │   ├── index.ts                   # Route registration
│   │   ├── transactions.ts            # Transaction endpoints
│   │   ├── proof.ts                   # Proof generation endpoint
│   │   ├── mappings.ts                # Mapping endpoints
│   │   ├── token_metadata.ts          # Token metadata endpoint
│   │   └── health_check.ts            # Health check endpoint
│   │
│   ├── controllers/                   # Request handlers
│   │   ├── transactions.ts            # Transaction business logic
│   │   ├── proof.ts                   # Proof generation logic
│   │   ├── mappings.ts                # Mapping logic
│   │   ├── token_metadata.ts          # Token metadata logic
│   │   └── health_check.ts            # Health check logic
│   │
│   ├── services/                      # Core business logic
│   │   ├── index.ts                   # Service exports
│   │   ├── transactions.ts            # Transaction queries
│   │   ├── proof.ts                   # Proof generation
│   │   ├── mappings.ts                # Mapping queries
│   │   ├── token_metadata.ts          # ERC20 token data fetching
│   │   └── health_check.ts            # DB health verification
│   │
│   ├── schemas/                       # Zod validation schemas
│   │   ├── index.ts                   # Schema exports
│   │   ├── transactions_query.ts      # Transaction query params
│   │   ├── proof_query.ts             # Proof request params
│   │   ├── mappings_query.ts          # Mapping query params
│   │   └── common.ts                  # Shared schemas (pagination, etc.)
│   │
│   ├── middlewares/                   # Express-like middlewares
│   │   ├── validate_query_params.ts   # Query parameter validation
│   │   └── response_context.ts        # Response formatting
│   │
│   ├── enums/                         # API-specific enums
│   │   ├── index.ts                   # Enum exports
│   │   └── networks.ts                # Network ID mappings
│   │
│   └── constants/                     # Contract ABIs and addresses
│       ├── erc20.ts                   # ERC20 ABI
│       └── bridge.ts                  # Bridge contract ABI
│
├── tests/                             # Test files
│   ├── controllers/                   # Controller tests
│   ├── services/                      # Service tests (api_services/)
│   ├── middlewares/                   # Middleware tests
│   └── test-utils.ts                  # Mock helpers
│
├── dist/                              # Built output
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── claude.md                          # This file
```

## Architecture Pattern: Route → Controller → Service

The API follows a **layered architecture**:

```
HTTP Request
     ↓
[Route] (OpenAPI definition, validation)
     ↓
[Controller] (HTTP handling, request/response formatting)
     ↓
[Service] (Business logic, database queries)
     ↓
MongoDB / Blockchain RPC
     ↓
[Service] (Transform data)
     ↓
[Controller] (Format response)
     ↓
[Route] (Return JSON)
     ↓
HTTP Response
```

### Why This Pattern?

- **Routes**: Define API contract (OpenAPI), input validation
- **Controllers**: Handle HTTP specifics (status codes, headers)
- **Services**: Reusable business logic, testable without HTTP

## Core Components

### Server (server.ts)

**Purpose**: Main application setup

**Key responsibilities**:

- Initialize Hono app
- Register routes
- Setup middlewares
- Configure OpenAPI documentation
- Start HTTP server

**Entry point**:

```typescript
const app = new OpenAPIHono();

// Register routes
app.route("/transactions", transactionsRoute);
app.route("/proofs", proofRoute);
// ...

// Serve OpenAPI docs at /docs
app.get("/docs", apiReference(...));

// Start server
serve({ fetch: app.fetch, port: config.PORT });
```

### Routes (OpenAPI Definitions)

Routes define the **API contract** using Hono's OpenAPI plugin.

#### Example: routes/transactions.ts

```typescript
export const transactionsRoute = new OpenAPIHono().openapi(
	createRoute({
		method: "get",
		path: "/",
		request: {
			query: TransactionsQuerySchema, // Zod validation
		},
		responses: {
			200: {
				description: "List of transactions",
				content: {
					"application/json": {
						schema: TransactionsResponseSchema,
					},
				},
			},
		},
		tags: ["Transactions"],
	}),
	transactionsController // Handler
);
```

**Benefits**:

- Automatic input validation (Zod)
- OpenAPI spec generation
- Type-safe request/response
- Interactive docs at `/docs`

#### Key Routes

| Route                               | Method | Purpose                                    |
| ----------------------------------- | ------ | ------------------------------------------ |
| `/transactions`                     | GET    | List bridge transactions with filters      |
| `/transactions/:depositCount`       | GET    | Get single transaction by ID               |
| `/proofs/:depositCount`             | GET    | Generate claim proof                       |
| `/mappings`                         | GET    | List token mappings                        |
| `/token-metadata/:network/:address` | GET    | Get token details (name, symbol, decimals) |
| `/health`                           | GET    | Check database health                      |
| `/docs`                             | GET    | OpenAPI documentation UI                   |

### Controllers

Controllers handle **HTTP-specific logic**:

- Parse request parameters
- Call services
- Format responses
- Handle errors with proper status codes

#### Example: controllers/transactions.ts

```typescript
export async function getTransactions(c: Context) {
	const query = c.req.valid("query"); // Validated by route

	try {
		// Call service
		const result = await transactionService.findTransactions(query);

		// Format response
		return c.json({
			success: true,
			data: result.transactions,
			pagination: result.pagination,
		});
	} catch (error) {
		// Error handling
		logger.error("Failed to fetch transactions", { error });
		return c.json({ success: false, error: error.message }, 500);
	}
}
```

**Key controllers**:

- `controllers/transactions.ts` - Transaction queries
- `controllers/proof.ts` - Proof generation
- `controllers/mappings.ts` - Token mapping queries
- `controllers/token_metadata.ts` - ERC20 metadata
- `controllers/health_check.ts` - Health checks

### Services (Business Logic)

Services contain **reusable business logic**:

- Database queries
- Data transformation
- External API calls (RPC)
- Complex computations

#### services/transactions.ts

**Key functions**:

- `findTransactions(query)` - Query with filters, pagination, sorting
- `findTransactionByDepositCount(count)` - Get single transaction
- `countTransactions(filters)` - Count for pagination

**Database operations**:

```typescript
const transactions = await db
	.collection("bridge_transactions")
	.find(filters)
	.sort({ timestamp: -1 })
	.skip(offset)
	.limit(limit)
	.toArray();
```

#### services/proof.ts

**Key functions**:

- `generateProof(depositCount)` - Generate Merkle proof for claim

**Flow**:

1. Fetch transaction from MongoDB
2. Verify status is READY_TO_CLAIM
3. Query Bridge Service for Merkle proof
4. Return proof data

**Used by**: Auto-claim service

#### services/token_metadata.ts

**Key functions**:

- `getTokenMetadata(network, address)` - Fetch ERC20 details

**Flow**:

1. Connect to blockchain RPC (viem)
2. Call ERC20 contract methods (name, symbol, decimals)
3. Return metadata

**Caching**: Consider caching token metadata (rarely changes)

#### services/mappings.ts

**Key functions**:

- `findMappings(query)` - Query token mappings
- `findMappingByNetworks(origin, dest, tokenAddr)` - Find specific mapping

**Database operations**:

```typescript
const mappings = await db.collection("token_mappings").find(filters).toArray();
```

### Schemas (Validation)

Schemas define **input validation** using Zod.

#### schemas/transactions_query.ts

```typescript
export const TransactionsQuerySchema = z.object({
	sourceNetwork: z.number().optional(),
	destinationNetwork: z.number().optional(),
	status: z.enum(["BRIDGED", "READY_TO_CLAIM", "CLAIMED"]).optional(),
	limit: z.number().min(1).max(100).default(10),
	offset: z.number().min(0).default(0),
	sortBy: z.enum(["timestamp", "amount"]).optional(),
	sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
```

**Benefits**:

- Type safety (inferred from schema)
- Automatic validation
- Descriptive error messages
- OpenAPI documentation

**Key schemas**:

- `transactions_query.ts` - Transaction filters
- `proof_query.ts` - Proof request params
- `mappings_query.ts` - Mapping filters
- `common.ts` - Pagination, sorting

### Middlewares

#### validate_query_params.ts

**Purpose**: Additional query parameter validation/transformation

**Example**:

- Convert string to number
- Validate network IDs against known networks
- Sanitize inputs

#### response_context.ts

**Purpose**: Add metadata to responses

**Example**:

```typescript
{
  "success": true,
  "data": [...],
  "pagination": { "limit": 10, "offset": 0, "total": 150 },
  "timestamp": "2024-01-15T12:00:00Z"
}
```

## API Endpoints Reference

### GET /transactions

**Purpose**: List bridge transactions with filtering

**Query parameters**:

- `sourceNetwork` (number) - Filter by origin network
- `destinationNetwork` (number) - Filter by destination network
- `status` (string) - BRIDGED | READY_TO_CLAIM | CLAIMED
- `originAddress` (string) - Filter by sender address
- `destinationAddress` (string) - Filter by recipient address
- `limit` (number) - Page size (1-100, default: 10)
- `offset` (number) - Pagination offset (default: 0)
- `sortBy` (string) - Sort field (timestamp, amount)
- `sortOrder` (string) - asc | desc (default: desc)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "depositCount": 12345,
      "sourceNetwork": 1,
      "destinationNetwork": 2,
      "status": "READY_TO_CLAIM",
      "amount": "1000000000000000000",
      "timestamp": 1705320000,
      ...
    }
  ],
  "pagination": {
    "limit": 10,
    "offset": 0,
    "total": 150
  }
}
```

### GET /transactions/:depositCount

**Purpose**: Get single transaction by deposit count

**Path parameters**:

- `depositCount` (number) - Transaction ID

**Response**:

```json
{
  "success": true,
  "data": {
    "depositCount": 12345,
    ...
  }
}
```

### GET /proofs/:depositCount

**Purpose**: Generate claim proof for transaction

**Path parameters**:

- `depositCount` (number) - Transaction ID

**Requirements**:

- Transaction must have status READY_TO_CLAIM

**Response**:

```json
{
  "success": true,
  "data": {
    "merkle_proof": ["0x...", "0x..."],
    "rollup_merkle_proof": ["0x...", "0x..."],
    "main_exit_root": "0x...",
    "rollup_exit_root": "0x...",
    ...
  }
}
```

**Used by**: Auto-claim service to submit claims

### GET /mappings

**Purpose**: List token mappings

**Query parameters**:

- `originNetwork` (number)
- `destinationNetwork` (number)
- `originTokenAddress` (string)
- `limit` (number)
- `offset` (number)

**Response**:

```json
{
  "success": true,
  "data": [
    {
      "originNetwork": 1,
      "destinationNetwork": 2,
      "originTokenAddress": "0x...",
      "destinationTokenAddress": "0x...",
      ...
    }
  ]
}
```

### GET /token-metadata/:network/:address

**Purpose**: Fetch ERC20 token metadata

**Path parameters**:

- `network` (number) - Network ID
- `address` (string) - Token contract address

**Response**:

```json
{
	"success": true,
	"data": {
		"name": "USD Coin",
		"symbol": "USDC",
		"decimals": 6,
		"address": "0x..."
	}
}
```

### GET /health

**Purpose**: Health check endpoint

**Response**:

```json
{
	"success": true,
	"data": {
		"status": "healthy",
		"database": "connected",
		"timestamp": 1705320000
	}
}
```

## Configuration

**Environment variables** (`src/config.ts`):

**Required**:

- `MONGODB_URI` - MongoDB connection string
    - Example: `mongodb://localhost:27017/bridge_hub`
- `RPC_URL` - Blockchain RPC endpoint (for token metadata, proofs)
    - Example: `https://polygon-rpc.com`

**Optional**:

- `PORT` - Server port (default: 3000)
- `BRIDGE_SERVICE_URL` - Bridge Service API (for proof generation)
- `CORS_ORIGINS` - Allowed CORS origins (default: \*)
- `SENTRY_DSN` - Error tracking

## Running the API

### Development

```bash
cd packages/api
bun run dev  # Hot reload on http://localhost:3000
```

### Production

```bash
cd packages/api
bun run build
bun start  # Runs dist/server.js
```

### Docker

```bash
# From root
docker build -f Dockerfile.api -t api .
docker run -p 3000:3000 --env-file .env api
```

### Accessing Documentation

Once running, visit:

```
http://localhost:3000/docs
```

Interactive OpenAPI documentation (powered by Scalar) where you can:

- Browse all endpoints
- View request/response schemas
- Test API calls directly

## Common Development Tasks

### Adding a New Endpoint

**Example**: Add `/transactions/:depositCount/history` endpoint

1. **Create schema**:

    ```typescript
    // schemas/transaction_history.ts
    export const TransactionHistoryParamsSchema = z.object({
    	depositCount: z.number(),
    });
    ```

2. **Create service**:

    ```typescript
    // services/transaction_history.ts
    export async function getTransactionHistory(depositCount: number) {
    	// Business logic
    	return await db
    		.collection("transaction_history")
    		.find({ depositCount })
    		.toArray();
    }
    ```

3. **Create controller**:

    ```typescript
    // controllers/transaction_history.ts
    export async function getHistory(c: Context) {
    	const { depositCount } = c.req.valid("param");
    	const history =
    		await transactionHistoryService.getTransactionHistory(depositCount);
    	return c.json({ success: true, data: history });
    }
    ```

4. **Define route**:

    ```typescript
    // routes/transaction_history.ts
    export const historyRoute = new OpenAPIHono()
      .openapi(
        createRoute({
          method: "get",
          path: "/:depositCount/history",
          request: { params: TransactionHistoryParamsSchema },
          responses: { 200: { description: "History", ... } },
        }),
        getHistory
      );
    ```

5. **Register in server**:

    ```typescript
    // server.ts
    app.route("/transactions", transactionsRoute);
    app.route("/transactions", historyRoute); // Add here
    ```

6. **Add tests**:
    ```typescript
    // tests/controllers/transaction_history.test.ts
    // tests/services/transaction_history.test.ts
    ```

### Modifying Query Filters

**Example**: Add `tokenAddress` filter to transactions

1. **Update schema**:

    ```typescript
    // schemas/transactions_query.ts
    export const TransactionsQuerySchema = z.object({
    	// ... existing fields
    	tokenAddress: z.string().optional(), // Add field
    });
    ```

2. **Update service**:

    ```typescript
    // services/transactions.ts
    export async function findTransactions(query) {
    	const filters: any = {};
    	// ... existing filters
    	if (query.tokenAddress) {
    		filters.tokenAddress = query.tokenAddress;
    	}
    	// ... query logic
    }
    ```

3. **Type check**:

    ```bash
    bun run type-check
    ```

4. **Test**:

    ```bash
    bun test
    ```

5. **Verify in docs**:
    - Restart server
    - Visit `/docs`
    - Check new parameter appears

### Adding Database Indexes

**For optimal performance**, add indexes for commonly queried fields:

```javascript
// MongoDB shell or migration script
db.bridge_transactions.createIndex({ status: 1 });
db.bridge_transactions.createIndex({ sourceNetwork: 1, destinationNetwork: 1 });
db.bridge_transactions.createIndex({ originAddress: 1 });
db.bridge_transactions.createIndex({ tokenAddress: 1 });
db.bridge_transactions.createIndex({ timestamp: -1 });

db.token_mappings.createIndex({
	originNetwork: 1,
	destinationNetwork: 1,
	originTokenAddress: 1,
});
```

## Error Handling

### Error Response Format

```json
{
	"success": false,
	"error": "Error message",
	"code": "ERROR_CODE"
}
```

### Common Error Codes

- **400 Bad Request**: Invalid query parameters
- **404 Not Found**: Transaction/resource not found
- **500 Internal Server Error**: Database error, RPC error
- **503 Service Unavailable**: Database disconnected

### Error Handling Pattern

```typescript
try {
	const result = await service.doSomething();
	return c.json({ success: true, data: result });
} catch (error) {
	logger.error("Operation failed", { error, context });

	if (error instanceof ValidationError) {
		return c.json({ success: false, error: error.message }, 400);
	}

	if (error instanceof NotFoundError) {
		return c.json({ success: false, error: "Not found" }, 404);
	}

	return c.json({ success: false, error: "Internal error" }, 500);
}
```

## Testing

### Running Tests

```bash
cd packages/api
bun test
```

### Test Structure

- `tests/controllers/*.test.ts` - Controller/route tests
- `tests/services/*.test.ts` - Service logic tests (in api_services/ folder)
- `tests/middlewares/*.test.ts` - Middleware tests
- `tests/test-utils.ts` - Mock helpers

### Mocking

**MongoDB**:

```typescript
// test-utils.ts
export const mockDb = {
	collection: () => ({
		find: vi.fn(() => ({
			sort: vi.fn(() => ({
				skip: vi.fn(() => ({
					limit: vi.fn(() => ({
						toArray: vi.fn(() => Promise.resolve(mockTransactions)),
					})),
				})),
			})),
		})),
	}),
};
```

**RPC (viem)**:

```typescript
// Mock contract reads
vi.mock("viem", () => ({
	createPublicClient: () => ({
		readContract: vi.fn(() => Promise.resolve("USDC")),
	}),
}));
```

## Performance Considerations

### Pagination

Always use pagination for list endpoints:

- Default limit: 10
- Max limit: 100
- Use offset-based pagination
- Return total count for UI

### Caching

Consider caching for:

- Token metadata (rarely changes)
- Token mappings (infrequent updates)
- Health check results (5-10s TTL)

**Implementation**:

```typescript
const cache = new Map();

export async function getTokenMetadataCached(network, address) {
	const key = `${network}:${address}`;
	if (cache.has(key)) return cache.get(key);

	const metadata = await getTokenMetadata(network, address);
	cache.set(key, metadata);
	setTimeout(() => cache.delete(key), 3600000); // 1 hour TTL

	return metadata;
}
```

### Database Query Optimization

- Use indexes (see "Adding Database Indexes" section)
- Project only needed fields
- Avoid N+1 queries (batch queries when possible)
- Use explain() to analyze slow queries

## CORS Configuration

For production, restrict CORS origins:

```typescript
// server.ts
import { cors } from "hono/cors";

app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGINS?.split(",") || "*",
		allowMethods: ["GET", "POST", "OPTIONS"],
		allowHeaders: ["Content-Type"],
	})
);
```

**Environment**:

```env
CORS_ORIGINS=https://app.example.com,https://dashboard.example.com
```

## Monitoring

### Logs

API uses structured logging:

```typescript
logger.info("Request received", { path, method, query });
logger.error("Database error", { error, operation });
```

**Key log events**:

- `Request received` - Incoming requests
- `Response sent` - Outgoing responses
- `Database query` - DB operations
- `RPC call` - Blockchain calls
- `Error` - All errors

### Metrics

Monitor these:

- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- RPC call latency

### Health Checks

Use `/health` endpoint for:

- Load balancer health checks
- Kubernetes liveness/readiness probes
- Monitoring dashboards

## Troubleshooting

### Issue: Slow query performance

**Check**:

1. Database indexes exist (see "Adding Database Indexes")
2. Query uses indexed fields
3. Pagination is used (not fetching all records)

**Debug**:

```javascript
// MongoDB shell
db.bridge_transactions.find({ status: "BRIDGED" }).explain("executionStats");
```

### Issue: Token metadata not loading

**Check**:

1. `RPC_URL` is set and accessible
2. Network ID matches RPC endpoint
3. Token address is valid contract

**Debug**:

```bash
# Test RPC manually
curl -X POST $RPC_URL \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}'
```

### Issue: Proof generation fails

**Check**:

1. Transaction status is READY_TO_CLAIM
2. `BRIDGE_SERVICE_URL` is accessible
3. Transaction exists in Bridge Service

**Debug**:

```bash
# Check Bridge Service
curl "$BRIDGE_SERVICE_URL/api/v1/merkle-proof?deposit_count=12345"
```

### Issue: OpenAPI docs not showing

**Check**:

1. Server is running
2. Visit correct URL: `/docs` (not `/api/docs`)
3. Check console for errors
4. Verify routes are registered in `server.ts`

## Related Documentation

- **Root claude.md**: Overall architecture
- **packages/commons/claude.md**: Shared types used here
- **packages/consumer/claude.md**: Consumer that populates data
- **packages/auto-claim/claude.md**: Auto-claim that consumes API
- **DEPLOYMENT.md**: Production deployment

## Key Takeaways

1. API follows **Route → Controller → Service** pattern
2. **OpenAPI** definitions provide docs + validation
3. **Zod schemas** validate all inputs
4. Services contain **reusable business logic**
5. **Pagination** is mandatory for list endpoints
6. Interactive docs available at `/docs`
7. **MongoDB indexes** are critical for performance
8. Use **structured logging** for debugging
9. **Type safety** throughout (TypeScript + Zod)
10. **Horizontal scaling** possible (stateless design)
