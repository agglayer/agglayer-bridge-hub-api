# Auto-Claim Service

> [!IMPORTANT]
> **Ownership of this service has transferred to the AgLayer team.**
>
> Ownership and ongoing maintenance of auto-claim-hub have migrated to the
> AgLayer team as part of AgLayer ecosystem consolidation. This is the same
> running service under new ownership — not a shutdown or a code migration to
> a successor entity. Apps Team is no longer the maintainer; direct questions
> and changes to the AgLayer team.

Automated service that claims ready bridge transactions on behalf of users. For complete system architecture and deployment topology, see [ARCHITECTURE.md](../../ARCHITECTURE.md).

## Overview

The Auto-Claim package is the automation layer that continuously monitors the Bridge Hub API for transactions ready to be claimed, fetches proofs, and submits claim transactions to the destination blockchain.

**Deployment Note**: In production, deploy **one auto-claim instance per destination network** you want to auto-claim for. See [ARCHITECTURE.md - Production Cluster Architecture](../../ARCHITECTURE.md#production-cluster-architecture) and [DEPLOYMENT.md - Multi-Network Deployment](../../DEPLOYMENT.md#multi-network-deployment).

## Quick Start

```bash
# Install dependencies
bun install

# Development (with hot reload)
bun run dev

# Production
bun run build
bun start

# Run tests
bun test
```

## Configuration

Create a `.env` file with required environment variables. For detailed configuration with examples, security guidelines, and RPC setup options, see [DEPLOYMENT.md - Auto-Claim Configuration](../../DEPLOYMENT.md#auto-claim-package).

**Required variables:**

- `BRIDGE_HUB_API_URL` - Bridge Hub API base URL
- `SOURCE_NETWORKS` - Source network IDs to monitor (JSON array)
- `DESTINATION_NETWORK` - Destination network ID for filtering
- `DESTINATION_NETWORK_CHAINID` - Destination chain ID for RPC
- `BRIDGE_CONTRACT` - Bridge contract address
- `PRIVATE_KEY` - Wallet private key for signing transactions
- `RPC_CONFIG` or (`BASE_ERPC_URL` + `ERPC_API_KEY`) - RPC endpoints configuration

**Optional variables:**

- `SENTRY_DSN` - Error tracking DSN

## Components

### AutoClaimService

Main service that orchestrates the claiming process.

**Key Methods:**

```typescript
// Main entry point - runs claiming loop (30s interval)
async claimTransactions(): Promise<void>

// Claims a single transaction
private async claim(transaction: IHubTransaction): Promise<void>

// Sends claim transaction to blockchain
private async sendTransaction(...params): Promise<void>
```

**Features:**

- Handles both ASSET and MESSAGE claim types
- Logs detailed information at each step
- Catches and logs errors without crashing
- Waits for transaction confirmation

### TransactionService

Handles communication with the Bridge Hub API.

**Key Methods:**

```typescript
// Fetch transactions ready to claim
async getPendingTransactions(): Promise<IHubTransaction[]>

// Get proof for a specific transaction
async getProof(
  sourceNetwork: number,
  depositCount: number,
  leafIndex: number
): Promise<ClaimProof | null>

// Compute global index for claim
computeGlobalIndex(
  indexLocal: number,
  sourceNetworkId: number
): bigint
```

**Features:**

- Automatic pagination handling
- Filters zero-amount MESSAGE transactions
- Comprehensive error handling
- Null-safe proof validation

## Global Index Calculation

The global index is computed differently based on the source network:

```typescript
// For mainnet (network 0)
globalIndex = (indexLocal + 2) ^ 64;

// For other networks
globalIndex = (indexLocal + (sourceNetworkId - 1) * 2) ^ 32;
```

This ensures unique identifiers across all networks.

## Project Structure

```
auto-claim/
├── src/
│   ├── services/
│   │   ├── auto-claim.ts      # Main claiming orchestration
│   │   └── transaction.ts     # API communication
│   ├── constants/
│   │   └── bridge.ts          # Bridge contract ABI
│   └── index.ts               # Entry point
├── tests/
│   ├── services/
│   │   ├── auto-claim.test.ts
│   │   └── transaction.test.ts
│   └── test-utils.ts          # Mocks and helpers
└── dist/
```

## See Also

- [README.md](../../README.md) - System overview and features
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Complete system architecture and claim flow
- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Configuration, multi-network deployment, and security guidelines
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development and testing guidelines
- [SECURITY.md](../../SECURITY.md) - Private key management and security best practices
