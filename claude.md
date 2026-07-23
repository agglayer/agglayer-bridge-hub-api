# Agglayer Bridge Hub

TypeScript monorepo for bridge transaction management in the Agglayer ecosystem.

## Stack

- **Runtime**: Node 24
- **Monorepo**: Lerna + pnpm workspaces
- **DB**: MongoDB (via `@polygonlabs/servercore-mongo`)
- **API**: Hono + Zod + OpenAPI (Scalar docs)
- **Blockchain**: viem
- **Build**: tsup
- **Test**: Vitest

## Commands

```bash
pnpm install          # Install all deps
pnpm run build        # Build all packages
pnpm run test         # Run all tests
pnpm run typecheck    # Type check all packages
```

## Architecture

```
CONSUMER → polls Aggkit Bridge Service → writes to MongoDB
API      → reads MongoDB → REST endpoints + OpenAPI docs
CONSUMER → reads MongoDB for BRIDGED transactions → queries Aggkit Bridge Service → updates status to LEAF_INCLUDED or READY_TO_CLAIM
AUTO-CLAIM → polls API for READY_TO_CLAIM → submits claims to blockchain
CONSUMER → detects claim events → updates status to CLAIMED
```

All three service packages depend on `@agglayer/bridge-hub-types` (shared types, no runtime logic).

## Key Conventions

- Transaction status flow: `BRIDGED → LEAF_INCLUDED → READY_TO_CLAIM → CLAIMED`
- All addresses are lowercased before storage
- Bridge Service API uses snake_case; internal models use camelCase
- `generateDocId()` hashes are used as MongoDB `_id` fields (exists in consumer + API services)
- `globalIndex` encoding differs pre-etrog vs post-etrog (see `decodeGlobalIndex` in consumer mappers)
- Auto-claim intentionally skips zero-amount MESSAGE transactions
- Cursor-based pagination via `startAfter` (hubUID), not offset-based

## Testing Strategy

Only pure logic has unit tests — mappers, validators, computeGlobalIndex. Service/controller layers are integration glue and are not unit tested. Tests live in `packages/*/tests/`.
