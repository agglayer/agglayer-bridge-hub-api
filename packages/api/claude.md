# API Package

Express REST API built on `@polygonlabs/express`'s registry-driven router (`@polygonlabs/express/registry` +
`@polygonlabs/openapi-registry`), with OpenAPI docs served via Scalar at `/docs`. Follows Route → Controller →
Service layering.

## Key Conventions

- `registry.ts` composes every operation via `.with(addXRoutes)`; each `routes/*.ts` file registers its
  operations' OpenAPI contracts (path, method, Zod request/response schemas) against the shared `TypedRegistry`
  — no handler references live here, only the schema/path declarations
- `server.ts` binds controller methods to registered operations via `createRegistryRouter({ registry
}).implement({...}).toExpress()`; every operation must have a handler or `.toExpress()` fails to typecheck
- Controllers are thin — extract already-validated `req.params`/`req.query`, call the service, call
  `handleResponse`/`handleError`. Each controller method is typed via `Handler<Operations['operationId']>` from
  `@polygonlabs/express/registry`, imported from `../registry.ts`
- Services do MongoDB queries and external calls (Bridge Service for proofs, viem for token metadata) — unchanged
  by the Express migration
- Request validation is handled entirely by the registry router itself (`createRequestValidator`), decoding
  `req.params`/`req.query` against the same Zod schemas registered on each operation. There is no bespoke
  validation middleware — a schema registered on a route is the only validation that exists for it
- Response validation is also enforced at runtime (`z.encode` against the registered response schema for
  whatever status the handler actually sent) — unlike the previous Hono setup, a response that doesn't match its
  declared schema now fails loudly (500 "Response failed schema validation") instead of silently serving
  whatever shape the handler produced. Every schema registered under `responses` must match
  `@polygonlabs/servercore`'s actual `handleResponse`/`handleError` output shape
  (`{ status: 'success', data, pagination? }` / `{ status: 'error', message, name, code, details }` — see
  `ApiErrorResponseSchema` in `schemas/common.ts` and `ResponseSchema`/`PaginatedResponseSchema` in
  `@agglayer/bridge-hub-types`)
- `@polygonlabs/logger` (via `setupLogger`/`getLogger`) powers per-request logging; `@polygonlabs/servercore`'s
  `Logger` singleton is still used directly by the service layer (`proof.ts`, `token_metadata.ts`) — migrating
  the service layer off it is tracked separately under epic #117, not part of the Express migration

## Testing

Request-validation edge cases are tested directly against the Zod schemas (`tests/schemas/`), since the registry
router's own request validator is generic and already covered upstream — there is no bespoke middleware left to
test. Controllers and services are integration glue — not unit tested.
