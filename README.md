# Agglayer Bridge Hub

A comprehensive bridge transaction indexing and claiming system for the Agglayer ecosystem. This monorepo provides services to monitor, store, expose, and automatically claim bridge transactions across multiple blockchain networks.

> **License Notice:** This software is licensed under a Source Available License. Free for non-production use. Production use requires Agglayer-Connected Deployment. See [LICENSE](./LICENSE) for restrictions.

## Overview

The Agglayer Bridge Hub consists of four main packages that work together to provide a complete bridge transaction management solution:

- **Commons** - Shared TypeScript types and interfaces
- **Consumer** - Event indexer that syncs bridging transaction data to MongoDB
- **API** - REST API that exposes bridge transactions and claim proofs
- **Auto-Claim** - Automated service that claims ready bridge transactions

## Features

- Real-time bridge transaction indexing from multiple chains
- RESTful API with OpenAPI documentation
- Automated transaction claiming
- Support for both ASSET and MESSAGE bridge types
- Comprehensive test coverage
- Type-safe development with TypeScript
- Fast development with Bun runtime

## Architecture

```
            COMMONS (Shared Types)
                           │
     ┌─────────────────────┼───────┐
     │                     │       │
     ▼                     ▼       ▼
 CONSUMER  →  MongoDB  ←  API  ←  AUTO-CLAIM
 (Indexer)               (HTTP)    (Claimer)
     │                              │
     └─ Aggkit                 Blockchain
        Bridge service
```

**Data Flow:** Consumer polls Aggkit Bridge Service for indexed data → Writes to MongoDB → API exposes data → Auto-Claim fetches and submits claims.

For detailed architecture including production cluster setup, cron jobs, and multi-network deployment, see **[ARCHITECTURE.md](./ARCHITECTURE.md)** (specifically [Production Cluster Architecture](./ARCHITECTURE.md#production-cluster-architecture)).

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

**API Documentation**: Visit `/docs` endpoint when running the API server to access interactive OpenAPI documentation.

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
- Aggkit Bridge Service access (for consumer)

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

For complete configuration reference including all environment variables, requirements, and examples for each package, see **[DEPLOYMENT.md - Configuration](./DEPLOYMENT.md#configuration)**.

For detailed development workflow including branch strategy, code quality checks, testing guidelines, and contribution process, see **[CONTRIBUTING.md](./CONTRIBUTING.md)**.

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

1. **Bridge** → User bridges tokens (status: BRIDGED)
2. **Index** → Consumer saves to MongoDB
3. **Ready** → Consumer updates (status: READY_TO_CLAIM)
4. **Claim** → Auto-claim fetches proof and submits to chain
5. **Complete** → Consumer updates (status: CLAIMED)

For the complete step-by-step transaction lifecycle with technical details, see **[ARCHITECTURE.md - Transaction Lifecycle](./ARCHITECTURE.md#complete-transaction-lifecycle)**.

## Testing

All packages include comprehensive test suites. Run tests with:

```bash
bun run test
```

For testing guidelines, coverage requirements, and writing new tests, see **[CONTRIBUTING.md - Testing Guidelines](./CONTRIBUTING.md#testing-guidelines)**.

## Contributing

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, development guidelines, and the process for submitting pull requests.

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

For security vulnerability reporting and bug bounty information, see [SECURITY.md](./SECURITY.md).

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

This project is licensed under a Source Available License by PT Services DMCC.

**Key Points:**

- Free for non-production use
- Production use allowed only for Agglayer-Connected Deployments
- Commercial license required for Bridge-as-a-Service or competing products
- See the [LICENSE](./LICENSE) file for complete terms and contact information

## Support

For issues and questions:

- Open an issue in the repository
- Check existing documentation
- Review API documentation at `/docs` endpoint

## Acknowledgments

Built with modern TypeScript tools and the Bun runtime for optimal performance and developer experience.
