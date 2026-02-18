# Consumer Package

Long-running daemon that polls the Aggkit Bridge Service API for new bridge/claim/mapping data, transforms it via mappers, and writes to MongoDB.

## Key Conventions

- Mappers (`src/mappers/`) are pure functions — all addresses lowercased, snake_case API fields mapped to camelCase
- Services (`src/services/`) are thin MongoDB wrappers via `executeMongoOperation`
- Two independent polling loops: `bridge_api_consumer` (bridge + claim + mapping data) and `claim_readiness_consumer` (status updates)
- `decodeGlobalIndex` handles both pre-etrog (mainnet flag in bit 64) and post-etrog encoding

## Testing

Only mappers are unit tested (`tests/mappers/`). Services are integration glue — not unit tested.
