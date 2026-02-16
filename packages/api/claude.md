# API Package

Hono-based REST API with OpenAPI docs (Scalar at `/docs`). Follows Route → Controller → Service layering.

## Key Conventions

- Routes define OpenAPI contracts with Zod schemas for auto-validation
- Controllers are thin — extract params, call service, return response
- Services do MongoDB queries and external calls (Bridge Service for proofs, viem for token metadata)
- Query param validation happens in middlewares (`validate_query_params.ts`) using Zod, then stored via `c.set("validatedQuery", ...)`

## Testing

Only middleware validators are unit tested (`tests/middlewares/`). Controllers and services are integration glue — not unit tested.
