# Agglayer Bridge Hub

A comprehensive bridge transaction indexing and claiming system for the Agglayer ecosystem. This monorepo provides services to monitor, store, expose, and automatically claim bridge transactions across multiple blockchain networks.

## Overview

The Agglayer Bridge Hub consists of four main packages that work together to provide a complete bridge transaction management solution:

- **Commons** - Shared TypeScript types and interfaces
- **Consumer** - Blockchain event indexer that syncs bridge data to MongoDB
- **API** - REST API that exposes bridge transactions and claim proofs
- **Auto-Claim** - Automated service that claims ready bridge transactions

## Features

- Real-time bridge transaction indexing from multiple chains
- RESTful API with OpenAPI documentation
- Automated transaction claiming with proof generation
- Support for both ASSET and MESSAGE bridge types
- Comprehensive test coverage
- Type-safe development with TypeScript
- Fast development with Bun runtime

## Architecture

```
                        ┌──────────────────┐
                        │     COMMONS      │
                        │  (Types/Schemas) │
                        └────────┬─────────┘
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
         ┌─────────────┐  ┌──────────┐  ┌──────────────┐
         │  CONSUMER   │  │   API    │◀─│ AUTO-CLAIM   │
         └──────┬──────┘  └────┬─────┘  └──────┬───────┘
                │              │   HTTP         │
    Writes to   │              │ Reads from     │ Submits to
                ▼              ▼                ▼
         ┌────────────────────────────┐  ┌───────────────────┐
         │      MongoDB Database      │  │ Blockchain (L2)   │
         └────────────────────────────┘  └───────────────────┘

Data Flow:
1. Consumer → Monitors blockchain & Bridge Service API → Writes to MongoDB
2. API → Reads from MongoDB → Exposes REST endpoints
3. Auto-Claim → Calls API via HTTP → Gets transactions & proofs → Submits claims to blockchain
```

## Packages

### [@agglayer/bridge-hub-commons](./packages/commons)

**Foundation layer** providing shared TypeScript types and interfaces used across all packages.

- TypeScript interfaces for bridge transactions
- Shared enums (transaction status, leaf types)
- API schema definitions
- Type safety across the monorepo

### [bridge-hub-consumer](./packages/consumer)

**Data ingestion layer** that monitors blockchain networks and indexes bridge transactions.

- Monitors bridge smart contracts for deposit/claim events
- Fetches transaction data from Bridge Service API
- Indexes transactions into MongoDB
- Updates claim readiness status
- Maintains token mappings and metadata

### [bridge-hub-api](./packages/api)

**Service layer** exposing bridge data via REST API with OpenAPI documentation.

- Query bridge transactions with advanced filtering
- Generate claim proofs for ready transactions
- Token metadata and mappings endpoints
- Interactive API documentation via Scalar
- Health check endpoints

**API Documentation**: Visit `/reference` endpoint when running the API server to access interactive OpenAPI documentation.

### [auto-claim-service](./packages/auto-claim)

**Automation layer** that automatically claims ready bridge transactions.

- Polls API for READY_TO_CLAIM transactions
- Fetches merkle proofs for eligible transactions
- Submits claim transactions to destination chains
- Handles ASSET and MESSAGE claim types
- Filters zero-amount MESSAGE transactions

## Prerequisites

- [Bun](https://bun.sh) >= 1.0.0
- MongoDB >= 4.4
- Access to blockchain RPC endpoints
- Bridge Service API access (for consumer)

## Quick Start

### Installation

```bash
# Install dependencies for all packages
bun install
```

### Development

```bash
# Run all services in development mode (with hot reload)
bun run dev

# Or run individual services
cd packages/api && bun run dev
cd packages/consumer && bun run dev
cd packages/auto-claim && bun run dev
```

### Build

```bash
# Build all packages
bun run build

# Build specific package
bun run build:api
bun run build:consumer
```

### Testing

```bash
# Run all tests
bun run test

# Run tests for specific package
cd packages/api && bun test
cd packages/consumer && bun test
cd packages/auto-claim && bun test
```

## Configuration

Each package requires specific environment variables. Create `.env` files in each package directory.

### Consumer Package

```bash
NETWORK_ID=1
NETWORK=mainnet
BRIDGE_SERVICE_URL=https://bridge-api.polygon.technology
BRIDGE_CONTRACT_ADDRESS=0x...
MONGODB_CONNECTION_URI=mongodb://localhost:27017
MONGODB_DB_NAME=bridge_hub
ETROG_UPDATE_BLOCK_NUMBER=1000000
SENTRY_DSN=https://...
```

### API Package

```bash
MONGODB_CONNECTION_URI=mongodb://localhost:27017
MONGODB_DB_NAME=bridge_hub
PROOF_CONFIG={"mainnet": {"1": "https://rpc..", ...}}
RPC_CONFIG={"mainnet": {"1": "https://rpc..", ...}}
SENTRY_DSN=https://...
PORT=3000
```

### Auto-Claim Package

```bash
BRIDGE_HUB_API_URL=http://localhost:3000
SOURCE_NETWORKS=[1,137]
DESTINATION_NETWORK=2442
DESTINATION_NETWORK_CHAINID=2442
BRIDGE_CONTRACT=0x...
PRIVATE_KEY=0x...
RPC_CONFIG={"2442": "https://rpc..."}
SENTRY_DSN=https://...
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed configuration guide.

## Development Workflow

### Adding Dependencies

```bash
# Add to root (affects all packages)
bun add -D <package-name>

# Add to specific package
cd packages/api && bun add <package-name>
```

### Code Quality

```bash
# Format code
bun run format

# Lint code
bun run lint

# Type check
bun run type-check

# Run all checks
bun run style:check
```

### Git Hooks

This project uses Husky for git hooks:

- **pre-commit**: Runs formatting and linting
- **commit-msg**: Validates commit message format (conventional commits)

## Monorepo Structure

```
agglayer-bridge-hub-api/
├── packages/
│   ├── commons/          # Shared types and interfaces
│   ├── api/              # REST API server
│   ├── consumer/         # Blockchain indexer
│   └── auto-claim/       # Automated claiming service
├── node_modules/         # Shared dependencies
├── package.json          # Root package configuration
├── lerna.json            # Lerna monorepo configuration
└── README.md            # This file
```

## Technology Stack

- **Runtime**: [Bun](https://bun.sh) - Fast JavaScript runtime
- **Language**: [TypeScript](https://www.typescriptlang.org/) - Type-safe development
- **Monorepo**: [Lerna](https://lerna.js.org/) - Package management
- **API Framework**: [Hono](https://hono.dev) - Ultra-fast web framework
- **Blockchain**: [viem](https://viem.sh) - TypeScript Ethereum library
- **Database**: [MongoDB](https://www.mongodb.com/) - Document database
- **Testing**: Bun's built-in test runner
- **Build Tool**: [tsup](https://tsup.egoist.dev/) - TypeScript bundler

## API Documentation

When running the API package, visit:

```
http://localhost:3000/docs
```

This provides interactive OpenAPI documentation powered by Scalar, where you can:

- Browse all available endpoints
- View request/response schemas
- Test API calls directly in the browser

## Transaction Lifecycle

1. **User Action**: User bridges tokens from source to destination chain
2. **Consumer Indexing**: Consumer detects bridge event from the chain's Aggkit and saves to MongoDB (status: BRIDGED)
3. **Readiness Update**: Consumer monitors the chain's Aggkit and updates status to READY_TO_CLAIM
4. **API Exposure**: Transaction becomes available via API with READY_TO_CLAIM status
5. **Auto-Claim**: Auto-claim service detects ready transaction and fetches proof
6. **Claiming**: Auto-claim submits claim transaction to destination chain
7. **Completion**: Consumer detects claim event from destination's Aggkit and updates status to CLAIMED

## Testing

All packages include comprehensive test suites:

- **API**: 50+ tests covering controllers, services, and middlewares
- **Consumer**: 30+ tests covering services and mappers
- **Auto-Claim**: 39 tests covering transaction and claim services
- **Commons**: Type checking only (no runtime tests needed)

Run tests with:

```bash
bun run test
```

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Development Guidelines

1. Follow TypeScript strict mode
2. Write tests for new features
3. Use conventional commits
4. Ensure all tests pass before committing
5. Update documentation for API changes

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.

### Production Build

```bash
# Build all packages
bun run build

# Start production services
cd packages/api && bun start
cd packages/consumer && bun start
cd packages/auto-claim && bun start
```

## Monitoring

All packages use `@polygonlabs/servercore` for structured logging with Sentry integration. Configure `SENTRY_DSN` environment variable to enable error tracking.

## Security Considerations

- **Private Keys**: Never commit private keys. Use secret management systems.
- **API Access**: Implement rate limiting in production.
- **Database**: Use authentication and network isolation.
- **RPC Endpoints**: Use reliable, authenticated RPC providers.

## Performance

- **Consumer**: Processes transactions sequentially per chain
- **API**: Stateless, can be horizontally scaled
- **Auto-Claim**: Polls every 30 seconds, single-threaded
- **Database**: Ensure proper indexing on `status`, `sourceNetwork`, `destinationNetwork`

## Troubleshooting

### Common Issues

**Issue**: Consumer not indexing transactions

- Check `BRIDGE_SERVICE_URL` is accessible
- Verify `NETWORK_ID` matches your target network
- Check MongoDB connection

**Issue**: API returning empty results

- Ensure consumer has indexed transactions
- Check MongoDB collections exist
- Verify query parameters

**Issue**: Auto-claim not claiming transactions

- Check wallet has sufficient gas
- Verify `BRIDGE_HUB_API_URL` is correct
- Ensure transactions are in READY_TO_CLAIM status
- Check RPC endpoint connectivity

## License

[Add license here]

## Support

For issues and questions:

- Open an issue in the repository
- Check existing documentation
- Review API documentation at `/docs` endpoint

## Acknowledgments

Built with modern TypeScript tools and the Bun runtime for optimal performance and developer experience.
