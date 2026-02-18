# @agglayer/bridge-hub-commons

Shared TypeScript types, interfaces, and schemas for the Agglayer Bridge Hub ecosystem. For complete system architecture, see [root README](../../README.md).

## Quick Start

```bash
# From monorepo root
bun install

# Build this package
cd packages/commons
bun run build

# Type check
bun run type-check
```

## Usage

Import types in other packages:

```typescript
import type {
	IHubTransaction,
	ITransactionResponse,
	ClaimProof,
	ClaimProofResponse,
} from "@agglayer/bridge-hub-commons";
```

## Exported Types

### Transaction Types

- `IHubTransaction` - Bridge transaction representation with status, networks, amounts, and claim details
- `ITransactionResponse` - API response format for transaction queries with pagination
- `ITransactionDocument` - MongoDB document schema for transactions collection

### Proof Types

- `ClaimProof` - Merkle proof data required for claiming transactions (proof roots, L1 info tree leaf, metadata)
- `ClaimProofResponse` - API response format for proof requests
- `L1InfoTreeLeaf` - L1 information tree leaf data structure

### Token Types

- `ITokenMapping` - Token address mappings between Agglayer networks
- `ITokenMetadata` - Token information (name, symbol, decimals)

### Enums

- Transaction status values: `BRIDGED`, `LEAF_INCLUDED`, `READY_TO_CLAIM`, `CLAIMED`
- Leaf types: `ASSET`, `MESSAGE`

## Package Structure

```
commons/
├── src/
│   ├── enums/              # Enumeration types
│   ├── interfaces/         # TypeScript interfaces
│   │   ├── bridge_transaction.ts
│   │   ├── transaction_document.ts
│   │   ├── proof.ts
│   │   └── ...
│   └── index.ts           # Main export file
├── dist/                  # Compiled output
└── package.json
```

## See Also

- [README.md](../../README.md) - System overview and features
- [ARCHITECTURE.md](../../ARCHITECTURE.md) - Complete system architecture and database schema
- [DEPLOYMENT.md](../../DEPLOYMENT.md) - Configuration and deployment guide
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - Development and testing guidelines
- [SECURITY.md](../../SECURITY.md) - Security information and bug bounty
