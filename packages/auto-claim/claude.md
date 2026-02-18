# Auto-Claim Package

Long-running daemon that polls the API for READY_TO_CLAIM transactions, fetches merkle proofs, and submits claim transactions to the blockchain via viem.

## Key Conventions

- Intentionally skips zero-amount MESSAGE transactions (only claims ASSET or non-zero MESSAGE)
- Uses `claimAsset()` for ASSET leaf type, `claimMessage()` for MESSAGE leaf type on the bridge contract
- `computeGlobalIndex` uses bitwise ops — mainnet flag at bit 64, rollup index at bits 32-63, deposit count at bits 0-31
- Claims are sequential (one at a time) to avoid nonce issues

## Testing

Only `computeGlobalIndex`, `filterEligibleTransactions`, and pagination logic are unit tested (`tests/services/transaction.test.ts`). The auto-claim orchestration is integration glue — not unit tested.
