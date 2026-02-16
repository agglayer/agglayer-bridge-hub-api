# Agglayer Bridge Hub - Claude Context

## Project Overview

Agglayer Bridge Hub is a TypeScript monorepo that provides a complete bridge transaction management system for the Agglayer ecosystem. It monitors, indexes, exposes, and automatically claims bridge transactions across multiple blockchain networks.

**Runtime**: Bun (fast JavaScript runtime)
**Language**: TypeScript
**Monorepo Tool**: Lerna with Bun workspaces
**Database**: MongoDB

## Architecture

This is a **microservices architecture** with four main packages:

```
┌─────────────────────────────────────────────────────────────┐
│                    COMMONS (Foundation)                      │
│           Shared types, interfaces, and schemas              │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                 │
         ▼                 ▼                 ▼
    ┌────────┐        ┌────────┐       ┌──────────┐
    │CONSUMER│───────▶│MongoDB │◀──────│   API    │
    │        │        │        │       │          │
    │Indexer │        │  DB    │       │ REST API │
    └────────┘        └────────┘       └────┬─────┘
         │                                   │
         │                                   ▼
         │                            ┌──────────┐
         │                            │AUTO-CLAIM│
         │                            │ Service  │
         │                            └──────────┘
         │                                   │
         ▼                                   ▼
  Aggkit Bridge                        Blockchain
     Service                           (Claims Txs)
```

### Data Flow

1. **CONSUMER** polls Aggkit Bridge Service → indexes transactions → writes to MongoDB
2. **API** reads from MongoDB → exposes REST endpoints with OpenAPI docs
3. **AUTO-CLAIM** polls API for READY_TO_CLAIM transactions → fetches proofs → submits claims to blockchain
4. **CONSUMER** detects claimed transactions → updates status to CLAIMED

## Monorepo Structure

```
agglayer-bridge-hub-api/
├── packages/
│   ├── commons/              # Foundation - shared types/interfaces
│   │   ├── src/
│   │   │   ├── enums/        # TransactionStatus, etc.
│   │   │   └── interfaces/   # BridgeTransaction, TokenMapping, etc.
│   │   └── claude.md         # Package-specific context
│   │
│   ├── consumer/             # Data Ingestion - blockchain indexer
│   │   ├── src/
│   │   │   ├── services/     # Transaction, mapping, metadata services
│   │   │   ├── mappers/      # Data transformation
│   │   │   ├── interfaces/   # Bridge API types
│   │   │   └── enums/        # Leaf types, metadata fields
│   │   └── claude.md         # Package-specific context
│   │
│   ├── api/                  # Service Layer - REST API
│   │   ├── src/
│   │   │   ├── controllers/  # Request handlers
│   │   │   ├── services/     # Business logic
│   │   │   ├── routes/       # Route definitions (OpenAPI)
│   │   │   ├── schemas/      # Zod validation schemas
│   │   │   └── middlewares/  # Query validation, response context
│   │   └── claude.md         # Package-specific context
│   │
│   └── auto-claim/           # Automation Layer - claim service
│       ├── src/
│       │   ├── services/     # Auto-claim, transaction services
│       │   └── constants/    # Bridge ABI
│       └── claude.md         # Package-specific context
│
├── package.json              # Root config (Lerna, shared scripts)
├── lerna.json                # Monorepo configuration
├── tsconfig.json             # Shared TypeScript config
├── README.md                 # User-facing documentation
├── ARCHITECTURE.md           # Detailed architecture docs
├── DEPLOYMENT.md             # Production deployment guide
├── CONTRIBUTING.md           # Development guidelines
└── claude.md                 # This file

```

## Package Dependencies

```
commons (independent)
   ↓
consumer → depends on commons
api → depends on commons
auto-claim → depends on commons
```

All service packages depend on `@agglayer/bridge-hub-commons` as a workspace dependency.

## Key Technologies

- **API Framework**: Hono (ultra-fast web framework)
- **API Docs**: Scalar (OpenAPI/Swagger UI)
- **Validation**: Zod (schema validation)
- **Blockchain**: viem (Ethereum library)
- **Database**: MongoDB (via @polygonlabs/servercore-mongo)
- **Logging**: @polygonlabs/servercore (structured logging + Sentry)
- **Build**: tsup (TypeScript bundler)
- **Testing**: Bun test (built-in test runner)

## Common Commands

```bash
# Monorepo-level
bun install              # Install all dependencies
bun run build            # Build all packages
bun run dev              # Run all services in dev mode
bun run test             # Run all tests
bun run type-check       # Type check all packages

# Package-specific
cd packages/api && bun run dev    # Run API in dev mode
cd packages/consumer && bun test  # Run consumer tests
```

## Transaction Status Flow

```
BRIDGED → READY_TO_CLAIM → CLAIMED
```

- **BRIDGED**: Initial state when transaction is indexed
- **READY_TO_CLAIM**: Merkle proof is available, can be claimed
- **CLAIMED**: Successfully claimed on destination chain

## Important Files

### Configuration

- `packages/*/src/config.ts` - Environment variable loading
- `.env` files - Environment-specific configuration (not in repo)

### Entry Points

- `packages/api/src/server.ts` - API server entry
- `packages/consumer/src/index.ts` - Consumer entry
- `packages/auto-claim/src/index.ts` - Auto-claim entry
- `packages/commons/src/index.ts` - Commons exports

### Core Logic

- `packages/api/src/routes/*.ts` - OpenAPI route definitions
- `packages/api/src/controllers/*.ts` - Request handlers
- `packages/api/src/services/*.ts` - Business logic
- `packages/consumer/src/*_consumer.ts` - Indexing logic
- `packages/consumer/src/services/*.ts` - Data persistence
- `packages/auto-claim/src/services/auto-claim.ts` - Claiming logic

## Development Patterns

### Package Structure Pattern

Each service package follows this structure:

```
src/
├── config.ts          # Environment configuration
├── index.ts           # Entry point
├── services/          # Business logic, database operations
├── controllers/       # (API only) Request handlers
├── routes/            # (API only) Route definitions
├── schemas/           # (API only) Validation schemas
├── middlewares/       # (API only) Middleware functions
├── mappers/           # (Consumer only) Data transformers
├── interfaces/        # Package-specific types
├── enums/             # Package-specific enums
└── constants/         # ABIs, addresses, etc.
```

### Code Organization

- **Services**: Database operations, external API calls, core business logic
- **Controllers**: HTTP request/response handling (API only)
- **Mappers**: Transform external data to internal types (Consumer only)
- **Schemas**: Zod validation for API requests (API only)

### Testing

- Tests are in `packages/*/tests/` directories
- Use Bun's built-in test runner
- Mock external dependencies (MongoDB, RPC endpoints)
- Test utilities in `test-utils.ts`

## Environment Variables

Each package has specific environment variables. Key ones:

### Consumer

- `BRIDGE_SERVICE_URL` - Aggkit Bridge Service endpoint
- `NETWORK_ID` - Network to monitor
- `MONGODB_URI` - Database connection

### API

- `PORT` - Server port (default: 3000)
- `MONGODB_URI` - Database connection
- `RPC_URL` - Blockchain RPC for proof generation

### Auto-Claim

- `BRIDGE_HUB_API_URL` - API endpoint
- `WALLET_PRIVATE_KEY` - Private key for claims
- `RPC_URL` - Blockchain RPC endpoint

See `DEPLOYMENT.md` for complete configuration details.

## Common Development Tasks

### Adding a New API Endpoint

1. Define Zod schema in `packages/api/src/schemas/`
2. Create controller in `packages/api/src/controllers/`
3. Add service logic in `packages/api/src/services/`
4. Define OpenAPI route in `packages/api/src/routes/`
5. Register route in `packages/api/src/routes/index.ts`
6. Add tests in `packages/api/tests/`

### Adding a New Consumer Feature

1. Add mapper if needed in `packages/consumer/src/mappers/`
2. Update service logic in `packages/consumer/src/services/`
3. Modify consumer in `packages/consumer/src/*_consumer.ts`
4. Add tests in `packages/consumer/tests/`

### Adding Shared Types

1. Add to `packages/commons/src/interfaces/` or `packages/commons/src/enums/`
2. Export from `packages/commons/src/index.ts`
3. Run `bun run type-check` to verify usage across packages

## TypeScript Configuration

- Root `tsconfig.json` provides base configuration
- Each package has its own `tsconfig.json` that extends the root
- Project references enabled for fast incremental builds
- Strict mode enabled

## Git Workflow

Current branch: `type-fixes`
Main branch: `main`

See `CONTRIBUTING.md` for branch strategy and PR process.

## Troubleshooting

### Build Issues

- Run `bun run type-check` to find TypeScript errors
- Check `packages/*/dist/` directories are being created
- Verify `tsup.config.ts` in each package

### Runtime Issues

- Check environment variables are set correctly
- Verify MongoDB is running and accessible
- Check Bun version with `bun --version` (requires >=1.0.0)

### Test Issues

- Run tests individually: `cd packages/api && bun test`
- Check mock implementations in `test-utils.ts`
- Verify test database connections

## Documentation

- **README.md** - User-facing overview and quick start
- **ARCHITECTURE.md** - Detailed architecture, production setup, transaction lifecycle
- **DEPLOYMENT.md** - Production deployment, configuration, Docker
- **CONTRIBUTING.md** - Development workflow, testing, PR process
- **SECURITY.md** - Security reporting
- **claude.md** (this file) - AI context for code assistance

For package-specific details, see `packages/*/claude.md` files.
