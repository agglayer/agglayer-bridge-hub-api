# @agglayer/bridge-hub-commons

Shared TypeScript types, interfaces, and schemas for the Agglayer Bridge Hub ecosystem.

## Overview

This package serves as the foundation layer for the Bridge Hub monorepo, providing type-safe contracts between all packages. It ensures consistency and type safety across the API, Consumer, and Auto-Claim services.

## Purpose

- **Type Safety**: Shared TypeScript interfaces prevent type mismatches between packages
- **Single Source of Truth**: All data structures defined in one place
- **Zero Runtime**: Pure TypeScript types with no runtime overhead
- **Schema Validation**: OpenAPI schema definitions for API contracts

## Installation

This package is part of the monorepo and installed automatically:

```bash
# From monorepo root
bun install
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

#### `IHubTransaction`

Represents a bridge transaction in the system.

```typescript
interface IHubTransaction {
	hubUID: string; // Unique identifier
	sourceNetwork: number; // Source chain ID
	destinationNetwork: number; // Destination chain ID
	status: string; // BRIDGED, READY_TO_CLAIM, CLAIMED
	leafType: string; // ASSET or MESSAGE
	amount: string; // Amount bridged (as string)
	depositCount: number; // Deposit counter
	leafIndexForProof?: number; // Index for merkle proof generation
	transactionHash: string; // Source transaction hash
	claimTransactionHash?: string; // Claim transaction hash (if claimed)
	// ... additional fields
}
```

#### `ITransactionResponse`

API response format for transaction queries.

```typescript
interface ITransactionResponse {
	success: boolean;
	data: IHubTransaction[];
	pagination: {
		total: number;
		limit: number;
		nextStartAfterCursor?: string;
	};
}
```

### Proof Types

#### `ClaimProof`

Merkle proof data required for claiming transactions.

```typescript
interface ClaimProof {
	proof_local_exit_root: string[];
	proof_rollup_exit_root: string[];
	l1_info_tree_leaf: L1InfoTreeLeaf;
	bridge_tx_metadata: string;
}
```

#### `ClaimProofResponse`

API response format for proof requests.

```typescript
interface ClaimProofResponse {
	success: boolean;
	data: ClaimProof;
}
```

### Enums

Available enums for transaction status, leaf types, and more.

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
├── package.json
└── tsconfig.json
```

## Dependencies

- `@hono/zod-openapi` - For OpenAPI schema definitions

## Development

### Building

```bash
bun run build
```

### Type Checking

```bash
bun run type-check
```

## Used By

- **bridge-hub-api** - Uses types for API request/response validation
- **bridge-hub-consumer** - Uses types for indexing transactions
- **auto-claim-service** - Uses types for API communication

## Adding New Types

1. Create a new file in `src/interfaces/` or `src/enums/`
2. Export from the file
3. Re-export from `src/index.ts`
4. Run `bun run build` to compile
5. Dependent packages will automatically have access to the new types

Example:

```typescript
// src/interfaces/my_new_type.ts
export interface MyNewType {
	id: string;
	name: string;
}

// src/index.ts
export * from "./interfaces/my_new_type";
```

## Versioning

This package follows semantic versioning. Breaking changes to interfaces require a major version bump as they affect all dependent packages.

## Notes

- This package has no runtime code - it's types only
- All types are exported as TypeScript interfaces/types
- No unit tests needed (TypeScript compiler validates types)
- Changes here affect all packages in the monorepo
