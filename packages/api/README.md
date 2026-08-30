# Bridge Hub API

> [!WARNING]
> **This service is deprecated and being wound down.**
>
> Per the 2026-07-23 Apps Team product review, the AggLayer (LXLY) bridge-hub
> API is being wound down as the AggLayer bridging estate is retired over the
> next 2-3 months, with the user-facing surface moving to Sequence/Trails
> (Taylan Pince team) and residual bridge-hub responsibilities consolidating to
> the AgLayer team (see auto-claim-hub, same repo).
>
> No new features should be added here.

REST API service that exposes bridge transaction data and claim proofs with OpenAPI documentation. For complete system architecture and cluster deployment, see [README.md](../../README.md) and [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Overview

The API package is the service layer that provides HTTP endpoints for querying bridge transactions, proxying claim proofs from Aggkit, and accessing token metadata. Built with Hono for performance and includes interactive API documentation via Scalar.

## Quick Start

```bash
# Install dependencies
bun install

# Development (with hot reload)
bun run dev
# Server starts at http://localhost:3000

# Production
bun run build
bun start

# Run tests
bun test
```

## Configuration

Create a `.env` file with required environment variables. For detailed configuration with JSON format examples and best practices, see [DEPLOYMENT.md - API Configuration](../../DEPLOYMENT.md#api-package).

**Required variables:**

- `MONGODB_CONNECTION_URI` - MongoDB connection string
- `MONGODB_DB_NAME` - Database name
- `RPC_CONFIG` - RPC endpoints by network (JSON format)
- `PROOF_CONFIG` - Proof generation endpoints by network (JSON format)

**Optional variables:**

- `PORT` - HTTP server port (default: 3000)
- `NODE_ENV` - Environment (development, production)
- `SENTRY_DSN` - Error tracking DSN

## API Documentation

**Interactive API documentation is available at:**

```
http://localhost:3000/docs
```

The Scalar UI provides:

- Complete endpoint reference with request/response schemas
- Interactive testing interface
- Query parameter documentation
- Example requests and responses
- Try-it-out functionality

**Available endpoints:**

- `GET /transactions` - Query bridge transactions with filtering and pagination
- `GET /claim-proof` - Proxy merkle proofs from Aggkit Bridge Service
- `GET /token-metadata` - Get token information
- `GET /token-mappings` - Get token address mappings
- `GET /health` - Health check endpoint

## Project Structure

```
api/
├── src/
│   ├── controllers/        # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # Route definitions
│   ├── schemas/           # Zod validation schemas
│   ├── middlewares/       # Custom middleware
│   ├── config.ts          # Configuration
│   └── server.ts          # Main server file
├── tests/
└── dist/
```

## See Also

- [README.md](../../README.md) - System overview, features, and architecture
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Complete system architecture, API design, and pagination strategy
- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Configuration, horizontal scaling, and operations guide
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development and testing guidelines
- [SECURITY.md](../../SECURITY.md) - Security best practices and bug bounty
