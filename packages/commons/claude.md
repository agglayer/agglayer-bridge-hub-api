# Commons Package - Claude Context

## Package Overview

**Package**: `@agglayer/bridge-hub-commons`
**Purpose**: Foundation layer providing shared TypeScript types, interfaces, and schemas used across all packages in the monorepo
**Type**: Library (no runtime, only types/interfaces)
**Dependencies**: Minimal (only @hono/zod-openapi for API schema definitions)

## Role in the System

Commons is the **dependency foundation** for all other packages. It ensures:

- Type safety across the entire monorepo
- Consistent data structures
- Single source of truth for domain models
- OpenAPI schema definitions for API contracts

```
            COMMONS
               ↓
    ┌──────────┼──────────┐
    ↓          ↓          ↓
CONSUMER      API    AUTO-CLAIM
```

Every other package depends on commons, but commons depends on nothing (except schema libraries).

## Package Structure

```
packages/commons/
├── src/
│   ├── enums/
│   │   ├── transaction_status.ts   # Transaction lifecycle states
│   │   └── index.ts                # Enum exports
│   │
│   ├── interfaces/
│   │   ├── bridge_transaction.ts   # Core bridge transaction interface
│   │   ├── transaction_document.ts # MongoDB document shape
│   │   ├── mapping_document.ts     # Token mapping document shape
│   │   ├── token_mapping.ts        # Token mapping types
│   │   ├── proof.ts                # Merkle proof structures
│   │   ├── common.ts               # Shared types (pagination, etc.)
│   │   └── index.ts                # Interface exports
│   │
│   └── index.ts                    # Main package export
│
├── dist/                           # Built output (TypeScript declarations)
├── package.json
├── tsconfig.json
├── tsup.config.ts                  # Build configuration
└── claude.md                       # This file
```

## Core Interfaces

### BridgeTransaction (bridge_transaction.ts)

The **central data model** for bridge transactions.

**Key fields**:

- `depositCount`: Unique identifier
- `sourceNetwork` / `destinationNetwork`: Chain IDs
- `status`: Transaction lifecycle state (see TransactionStatus enum)
- `leafType`: ASSET or MESSAGE
- `originAddress` / `destinationAddress`: User addresses
- `tokenAddress`: Token being bridged
- `amount`: Transfer amount
- `metadata`: Additional data (decoded message, etc.)
- `globalIndex`: Used for claim proof generation
- `timestamp`: When transaction was bridged
- `claimTxHash`: Hash of claim transaction (if claimed)

**Used by**:

- **Consumer**: Fetches from Bridge API, stores in MongoDB
- **API**: Exposes via REST endpoints
- **Auto-Claim**: Fetches ready transactions, submits claims

### TransactionDocument (transaction_document.ts)

MongoDB document shape for bridge transactions. Extends `BridgeTransaction` with database-specific fields like `_id`.

**Used by**:

- **Consumer**: Database insert/update operations
- **API**: Database query results

### MappingDocument (mapping_document.ts)

MongoDB document for token mappings across chains.

**Key fields**:

- `originNetwork` / `destinationNetwork`: Chain pair
- `originTokenAddress` / `destinationTokenAddress`: Token addresses
- `timestamp`: When mapping was created

**Used by**:

- **Consumer**: Stores token mappings
- **API**: Exposes mapping data

### Proof (proof.ts)

Merkle proof structure for claiming transactions.

**Key fields**:

- `merkle_proof`: Array of merkle tree nodes
- `rollup_merkle_proof`: Rollup-specific proof
- `main_exit_root` / `rollup_exit_root`: Merkle roots

**Used by**:

- **API**: Generates and returns proofs
- **Auto-Claim**: Uses proofs to submit claims

### Common Types (common.ts)

Shared utility types like pagination, filters, etc.

**Examples**:

- `PaginationParams`: limit, offset
- `NetworkFilter`: sourceNetwork, destinationNetwork
- Query parameter types

**Used by**:

- **API**: Request/response types
- **Auto-Claim**: Query filters

## Enums

### TransactionStatus (enums/transaction_status.ts)

**Transaction lifecycle states**:

```typescript
export enum TransactionStatus {
	BRIDGED = "BRIDGED", // Initial state after bridging
	READY_TO_CLAIM = "READY_TO_CLAIM", // Proof available, can claim
	CLAIMED = "CLAIMED", // Successfully claimed
}
```

**State transitions**:

```
BRIDGED → READY_TO_CLAIM → CLAIMED
```

**Used by**:

- **Consumer**: Updates transaction status
- **API**: Filters transactions by status
- **Auto-Claim**: Queries for READY_TO_CLAIM transactions

## Export Pattern

**Main export** (`src/index.ts`):

```typescript
export * from "./interfaces/index.js";
export * from "./enums/index.js";
```

All types are re-exported from the main entry point for easy importing:

```typescript
// In other packages
import {
	BridgeTransaction,
	TransactionStatus,
} from "@agglayer/bridge-hub-commons";
```

## Build Configuration

**tsup.config.ts**:

- Entry: `src/index.ts`
- Format: ESM (ES modules)
- Output: `dist/index.js` and `dist/index.d.ts`
- DTS: TypeScript declarations only
- Clean: Clears dist before build

**Key scripts**:

- `bun run build` - Builds TypeScript declarations
- `bun run type-check` - Type checks without building

## Development Guidelines

### Adding New Types

1. **Determine category**:
    - Domain models → `interfaces/`
    - Constants/enums → `enums/`
    - Utility types → `interfaces/common.ts`

2. **Create file**:

    ```typescript
    // interfaces/my_new_type.ts
    export interface MyNewType {
    	field1: string;
    	field2: number;
    }
    ```

3. **Export from category index**:

    ```typescript
    // interfaces/index.ts
    export * from "./my_new_type.js";
    ```

4. **Type check across monorepo**:
    ```bash
    cd ../../  # Return to root
    bun run type-check
    ```

### Modifying Existing Types

**IMPORTANT**: Changing types in commons affects all packages!

**Safe changes**:

- Adding optional fields: `newField?: string`
- Adding new enums/interfaces (non-breaking)

**Breaking changes** (require updates in other packages):

- Removing fields
- Renaming fields
- Changing field types
- Making optional fields required

**Process**:

1. Update type in commons
2. Run `bun run type-check` from root to find all usages
3. Update all affected packages
4. Run tests: `bun run test`

### Type Safety Best Practices

- Use strict TypeScript (`strict: true`)
- Prefer `interface` over `type` for object shapes
- Use `enum` for fixed sets of values
- Use optional fields (`?`) instead of `| null` when possible
- Document complex types with JSDoc comments

## OpenAPI Schema Integration

Commons uses `@hono/zod-openapi` for API schema definitions. This enables:

- Runtime validation (Zod)
- OpenAPI documentation generation
- Type inference from schemas

**Used by API package** for route definitions and validation.

## Testing

Commons is a **pure type package** with no runtime logic, so:

- No unit tests needed (TypeScript is the test)
- Type checking via `bun run type-check` is the validation
- Integration tests in dependent packages verify usage

## Dependencies

**Production**:

- `@hono/zod-openapi` - OpenAPI schema integration

**Dev**:

- `@types/bun` - Bun runtime types
- `typescript` - Type checking

**Peer**:

- `typescript` - Required by consuming packages

## Common Issues

### Issue: Changes not reflected in other packages

**Solution**: Rebuild commons and consuming packages

```bash
cd packages/commons && bun run build
cd ../api && bun run build  # Or other packages
```

### Issue: Import errors with .js extension

**Solution**: Ensure all local imports use `.js` extension (TypeScript ESM requirement)

```typescript
// Correct
export * from "./interfaces/index.js";

// Incorrect
export * from "./interfaces/index";
```

### Issue: Type mismatches across packages

**Solution**: Ensure all packages use the same version of commons

```bash
cd ../../  # Root
bun run bootstrap  # Re-link workspace dependencies
```

## Related Documentation

- **Root README.md**: Monorepo overview
- **Root claude.md**: Overall architecture context
- **packages/api/claude.md**: API usage of commons types
- **packages/consumer/claude.md**: Consumer usage of commons types
- **packages/auto-claim/claude.md**: Auto-claim usage of commons types

## Key Takeaways

1. Commons is **dependency-free** (except schema libraries)
2. It defines the **contract** between all packages
3. Changes here **impact all packages** - be careful!
4. It's **types only** - no runtime logic
5. Always run `type-check` after changes to verify impact
