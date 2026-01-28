# Bridge Hub API

REST API service that exposes bridge transaction data and claim proofs with OpenAPI documentation.

## Overview

The API package is the service layer of the Bridge Hub system. It provides HTTP endpoints for querying bridge transactions, generating claim proofs, and accessing token metadata. Built with Hono for performance and includes interactive API documentation via Scalar.

## Features

- RESTful API with comprehensive filtering and pagination
- OpenAPI 3.0 specification with interactive documentation
- Merkle proof generation for claim transactions
- Token metadata and mapping endpoints
- Health check and monitoring
- CORS support for browser clients
- Type-safe request/response validation with Zod

## Installation

```bash
# From package directory
bun install
```

## Configuration

Create a `.env` file in the package root with the following variables:

**Required:**

- `MONGODB_CONNECTION_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name
- `RPC_CONFIG` - RPC endpoints by network (JSON format)
- `PROOF_CONFIG` - Proof generation endpoints by network (JSON format)

**Optional:**

- `PORT` - HTTP server port (default: 3000)
- `NODE_ENV` - Environment (development, production)
- `SENTRY_DSN` - Error tracking DSN

For detailed configuration with examples, JSON format specifications, and best practices, see **[DEPLOYMENT.md - API Configuration](../../DEPLOYMENT.md#api-package)**.

## Usage

### Development

```bash
# Run with hot reload
bun run dev
```

Server starts at `http://localhost:3000`

### Production

```bash
# Build
bun run build

# Start
bun start
```

### Testing

```bash
# Run all tests
bun run test

# Run specific test suites
bun run test:services
bun run test:controllers
bun run test:middlewares
```

## API Documentation

Interactive API documentation is available at:

```
http://localhost:3000/docs
```

The documentation is powered by Scalar and provides:

- Complete endpoint reference
- Request/response schemas
- Interactive testing interface
- Authentication details
- Example requests

## API Endpoints

### Transaction Endpoints

#### `GET /transactions`

Query bridge transactions with filtering and pagination.

**Query Parameters:**

- `sourceNetworkIds` (optional) - Comma-separated list of source network IDs
- `destinationNetworkIds` (optional) - Comma-separated list of destination network IDs
- `status` (optional) - Transaction status filter (BRIDGED, READY_TO_CLAIM, CLAIMED)
- `limit` (optional, default: 50) - Number of results per page
- `startAfter` (optional) - Cursor for pagination

**Example:**

```bash
curl "http://localhost:3000/transactions?destinationNetworkIds=2442&status=READY_TO_CLAIM&limit=10"
```

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "hubUID": "unique-id",
      "sourceNetwork": 1,
      "destinationNetwork": 2442,
      "status": "READY_TO_CLAIM",
      "leafType": "ASSET",
      "amount": "1000000000000000000",
      "depositCount": 42,
      "transactionHash": "0x...",
      "receiverAddress": "0x...",
      ...
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 10,
    "nextStartAfterCursor": "unique-id-10"
  }
}
```

#### `GET /claim-proof`

Generate merkle proof for claiming a transaction.

**Query Parameters:**

- `sourceNetworkId` (required) - Source network chain ID
- `depositCount` (required) - Deposit count of the transaction
- `leafIndex` (required) - Leaf index for proof generation

**Example:**

```bash
curl "http://localhost:3000/claim-proof?sourceNetworkId=1&depositCount=42&leafIndex=10"
```

**Response:**

```json
{
  "success": true,
  "data": {
    "proof_local_exit_root": ["0x...", "0x..."],
    "proof_rollup_exit_root": ["0x...", "0x..."],
    "l1_info_tree_leaf": {
      "block_num": 1000,
      "l1_info_tree_index": 100,
      "timestamp": 1700000000,
      ...
    },
    "bridge_tx_metadata": "0x..."
  }
}
```

### Token Endpoints

#### `GET /token-metadata`

Get token information by address and network.

**Query Parameters:**

- `tokenAddress` (required) - Token contract address
- `networkId` (required) - Network chain ID

#### `GET /token-mappings`

Get token address mappings between networks.

**Query Parameters:**

- `originNetwork` (optional) - Origin network ID
- `destinationNetwork` (optional) - Destination network ID

### Utility Endpoints

#### `GET /health`

Health check endpoint for monitoring.

**Response:**

```json
{
	"status": "healthy",
	"timestamp": "2024-01-27T10:00:00Z",
	"services": {
		"database": "connected",
		"api": "running"
	}
}
```

## Architecture

```
Client Request
     │
     ▼
┌─────────────┐
│   Router    │  (Route definitions)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Controller  │  (Request validation, response formatting)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Service    │  (Business logic)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  MongoDB    │  (Data persistence)
└─────────────┘
```

**Note**: This shows the internal API architecture. For how the API fits into the overall cluster with multiple consumer instances and shared database, see [ARCHITECTURE.md - Production Cluster Architecture](../../ARCHITECTURE.md#production-cluster-architecture).

## Project Structure

```
api/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── transactions.ts
│   │   ├── proof.ts
│   │   └── ...
│   ├── services/          # Business logic
│   │   ├── transactions.ts
│   │   ├── proof.ts
│   │   ├── mappings.ts
│   │   └── token_metadata.ts
│   ├── routes/            # Route definitions
│   │   ├── transactions.ts
│   │   ├── proof.ts
│   │   └── index.ts
│   ├── schemas/           # Zod validation schemas
│   │   ├── transaction.ts
│   │   └── proof.ts
│   ├── middlewares/       # Custom middleware
│   ├── config.ts          # Configuration
│   └── server.ts          # Main server file
├── tests/
│   ├── controllers/
│   ├── services/
│   └── middlewares/
├── dist/                  # Compiled output
└── package.json
```

## Services

### TransactionService

Handles transaction queries with advanced filtering.

```typescript
const service = new TransactionService(collection);

// Query with filters
const transactions = await service.getTransactions({
	sourceNetworkIds: [1, 137],
	destinationNetworkIds: [2442],
	status: "READY_TO_CLAIM",
	limit: 50,
});
```

### ProofService

Generates merkle proofs for claiming.

```typescript
const service = new ProofService(rpcConfig, proofConfig);

// Generate proof
const proof = await service.generateProof(
	sourceNetworkId,
	depositCount,
	leafIndex
);
```

### MappingsService

Manages token address mappings.

```typescript
const service = new MappingsService(collection);

// Get mappings
const mappings = await service.getMappings({
	originNetwork: 1,
	destinationNetwork: 2442,
});
```

### TokenMetadataService

Provides token information.

```typescript
const service = new TokenMetadataService(rpcConfig);

// Get token metadata
const metadata = await service.getMetadata(tokenAddress, networkId);
```

## Middleware

### Error Handling

Automatic error handling with structured responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": { ... }
  }
}
```

### CORS

CORS enabled for all origins (configurable in production):

```typescript
app.use(
	cors({
		origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
	})
);
```

### Logging

Request/response logging via Hono logger middleware.

## Error Handling

The API returns consistent error responses:

**400 Bad Request** - Invalid input

```json
{
	"success": false,
	"error": "Invalid sourceNetworkId parameter"
}
```

**404 Not Found** - Resource not found

```json
{
	"success": false,
	"error": "Transaction not found"
}
```

**500 Internal Server Error** - Server error

```json
{
	"success": false,
	"error": "Internal server error",
	"requestId": "req-123"
}
```

## Pagination

The API uses cursor-based pagination:

1. First request: `GET /transactions?limit=50`
2. Response includes `nextStartAfterCursor` if more results exist
3. Next page: `GET /transactions?limit=50&startAfter=cursor-value`

**Benefits:**

- Consistent results even with new data
- No offset/limit edge cases
- Better performance for large datasets

## Performance

### Optimization Tips

1. **Database Indexes**: Ensure MongoDB indexes on:
    - `status`
    - `sourceNetwork`, `destinationNetwork`
    - `depositCount`

2. **Query Limits**: Use reasonable `limit` values (default: 50, max: 100)

3. **Caching**: Consider adding Redis for:
    - Frequently accessed transactions
    - Token metadata
    - Proof data (short TTL)

4. **Horizontal Scaling**: The API is stateless and can be scaled horizontally

### Performance Metrics

- **Response Time**: <100ms for typical queries
- **Throughput**: ~1000 requests/second (single instance)
- **Memory**: ~150-250MB per instance

## Monitoring

### Structured Logging

All logs include context:

```typescript
Logger.info({
	location: "TransactionController.get",
	query: { status: "READY_TO_CLAIM", limit: 50 },
	resultCount: 25,
	duration: 45,
});
```

### Health Checks

Use the `/health` endpoint for:

- Load balancer health checks
- Monitoring tools (Prometheus, Datadog)
- Automated alerts

### Sentry Integration

Errors are automatically reported to Sentry when configured:

```bash
SENTRY_DSN=https://...@sentry.io/...
```

## Testing

### Test Coverage

- **Controllers**: Request validation, response formatting
- **Services**: Business logic, error handling
- **Middlewares**: Authentication, error handling
- **Integration**: End-to-end API flows

### Running Tests

```bash
# All tests
bun test

# With coverage
bun test --coverage

# Specific suite
bun test tests/controllers/transactions.test.ts
```

## Deployment

### Docker

```dockerfile
FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "dist/server.js"]
```

### Scaling

The API is stateless and can be horizontally scaled:

```bash
# Behind a load balancer
API_INSTANCE_1: PORT=3001
API_INSTANCE_2: PORT=3002
API_INSTANCE_3: PORT=3003
```

## Security

> **Note**: For security vulnerability reporting and Polygon's bug bounty program, see [SECURITY.md](../../SECURITY.md).

### Best Practices

1. **Input Validation**: All inputs validated via Zod schemas
2. **Rate Limiting**: Implement rate limiting in production
3. **CORS**: Configure allowed origins in production
4. **Secrets**: Use environment variables, never commit secrets
5. **Database**: Use authenticated MongoDB connections

### Recommended Additions

```typescript
// Rate limiting
import { rateLimiter } from "hono-rate-limiter";

app.use(
	rateLimiter({
		windowMs: 15 * 60 * 1000, // 15 minutes
		max: 100, // limit each IP to 100 requests per window
	})
);
```

## Troubleshooting

### API not starting

**Check MongoDB connection:**

```bash
mongosh $MONGODB_CONNECTION_URI
```

**Check port availability:**

```bash
lsof -i :3000
```

### Slow queries

**Enable MongoDB query profiling:**

```javascript
db.setProfilingLevel(2);
db.system.profile.find().pretty();
```

**Check indexes:**

```javascript
db.transactions.getIndexes();
```

### Proof generation failing

- Verify RPC endpoints in `PROOF_CONFIG`
- Check network connectivity to RPC providers
- Validate `sourceNetworkId`, `depositCount`, `leafIndex` parameters

## Dependencies

- `hono` - Web framework
- `@hono/zod-openapi` - OpenAPI integration
- `@scalar/hono-api-reference` - API documentation UI
- `zod` - Schema validation
- `viem` - Blockchain utilities
- `@agglayer/bridge-hub-commons` - Shared types
- `@polygonlabs/servercore` - Logging
- `@polygonlabs/servercore-mongo` - MongoDB client

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the repository root.

## License

See [LICENSE](../../LICENSE) in the repository root.
