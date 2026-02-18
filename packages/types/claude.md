# Types Package

Pure types package — no runtime logic, no tests needed. TypeScript type-checking is the validation.

## Gotchas

- Changes here affect ALL other packages — always run `bun run type-check` from root after modifying
- Uses `@hono/zod-openapi` for API schema definitions that double as runtime validators in the API package
