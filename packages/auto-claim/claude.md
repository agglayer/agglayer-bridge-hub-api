# Auto-Claim Package - Claude Context

## Package Overview

**Package**: `auto-claim-service`
**Purpose**: Automation layer that automatically claims ready bridge transactions
**Type**: Service (long-running daemon)
**Dependencies**: `@agglayer/bridge-hub-commons`, viem

## Role in the System

Auto-claim is the **automation layer** that:

1. Polls the API for READY_TO_CLAIM transactions
2. Fetches merkle proofs for eligible transactions
3. Submits claim transactions to destination blockchains
4. Handles both ASSET and MESSAGE claim types
5. Filters out zero-amount MESSAGE transactions

```
      API (/transactions?status=READY_TO_CLAIM)
           ↓
   [Auto-Claim Service]
           ↓
   Fetch proof (/proofs/:depositCount)
           ↓
   Submit claim to blockchain (viem)
           ↓
   Destination Chain
```

After claiming, the **Consumer** detects the claim event and updates the transaction status to CLAIMED.

## Package Structure

```
packages/auto-claim/
├── src/
│   ├── index.ts                       # Main entry point
│   │
│   ├── services/
│   │   ├── auto-claim.ts              # Main claiming logic
│   │   └── transaction.ts             # Transaction fetching/filtering
│   │
│   └── constants/
│       └── bridge.ts                  # Bridge contract ABI
│
├── tests/                             # Test files
│   ├── services/
│   │   ├── auto-claim.test.ts         # Claim logic tests
│   │   └── transaction.test.ts        # Transaction fetch tests
│   └── test-utils.ts                  # Mock helpers
│
├── dist/                              # Built output
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── claude.md                          # This file
```

## Core Components

### Entry Point (index.ts)

**Purpose**: Initialize and start the auto-claim service

**Flow**:

1. Load configuration from environment variables
2. Initialize blockchain wallet (from private key)
3. Start auto-claim loop
4. Handle errors and retry logic

**Example**:

```typescript
import { startAutoClaim } from "./services/auto-claim.js";

async function main() {
	logger.info("Starting auto-claim service");
	await startAutoClaim();
}

main().catch((error) => {
	logger.error("Fatal error", { error });
	process.exit(1);
});
```

### services/auto-claim.ts

**Purpose**: Core auto-claim business logic

**Key functions**:

#### `startAutoClaim()`

Main loop that runs continuously.

**Flow**:

```
1. Fetch READY_TO_CLAIM transactions from API
2. Filter eligible transactions (exclude zero-amount MESSAGE)
3. For each transaction:
   a. Fetch merkle proof from API
   b. Build claim transaction
   c. Estimate gas
   d. Submit to blockchain
   e. Wait for confirmation
4. Sleep for polling interval
5. Repeat
```

**Polling interval**: Default 30 seconds (configurable)

#### `claimTransaction(tx, proof, wallet, client)`

Submits a single claim transaction.

**Parameters**:

- `tx` - Transaction to claim
- `proof` - Merkle proof from API
- `wallet` - Wallet account (viem)
- `client` - RPC client (viem)

**Flow**:

1. Determine claim type (ASSET vs MESSAGE)
2. Build transaction data:
    - For ASSET: `claimAsset()` function
    - For MESSAGE: `claimMessage()` function
3. Estimate gas
4. Send transaction
5. Wait for receipt
6. Log result

**Contract interaction** (viem):

```typescript
const hash = await wallet.writeContract({
	address: BRIDGE_CONTRACT_ADDRESS,
	abi: BRIDGE_ABI,
	functionName: "claimAsset",
	args: [
		proof.merkle_proof,
		proof.rollup_merkle_proof,
		tx.globalIndex,
		tx.mainnetExitRoot,
		tx.rollupExitRoot,
		tx.originNetwork,
		tx.originAddress,
		tx.destinationNetwork,
		tx.destinationAddress,
		tx.amount,
		tx.metadata,
	],
});

const receipt = await client.waitForTransactionReceipt({ hash });
```

#### `shouldClaimTransaction(tx)`

Filter function to determine if a transaction should be claimed.

**Rules**:

- Status must be READY_TO_CLAIM
- For MESSAGE type: amount must be > 0 (skip zero-amount messages)
- For ASSET type: always claim

**Why skip zero-amount MESSAGE?**
Zero-amount MESSAGE transactions are often just cross-chain calls with no value transfer. They may not need claiming or may be claimed by the recipient themselves.

#### Error Handling

**Retryable errors**:

- Network errors (RPC timeout)
- Gas estimation failures
- Insufficient funds (log warning, continue)

**Fatal errors**:

- Invalid private key
- RPC endpoint unreachable
- Contract not found

**Example**:

```typescript
try {
	await claimTransaction(tx, proof, wallet, client);
	logger.info("Claim successful", { depositCount: tx.depositCount, txHash });
} catch (error) {
	if (error.code === "INSUFFICIENT_FUNDS") {
		logger.warn("Insufficient funds to claim", {
			depositCount: tx.depositCount,
		});
		// Continue to next transaction
	} else {
		logger.error("Claim failed", { depositCount: tx.depositCount, error });
		// Retry later (transaction will still be READY_TO_CLAIM)
	}
}
```

### services/transaction.ts

**Purpose**: Fetch and filter transactions from API

**Key functions**:

#### `fetchReadyTransactions(apiUrl)`

Fetches transactions with status READY_TO_CLAIM from the API.

**API call**:

```typescript
const response = await fetch(
	`${apiUrl}/transactions?status=READY_TO_CLAIM&limit=100`
);
const data = await response.json();
return data.data; // Array of transactions
```

**Returns**: Array of `BridgeTransaction` objects

#### `filterEligibleTransactions(transactions)`

Filters transactions based on claiming rules.

**Filters**:

```typescript
return transactions.filter((tx) => {
	// Skip zero-amount MESSAGE transactions
	if (tx.leafType === LeafType.MESSAGE && BigInt(tx.amount) === 0n) {
		return false;
	}
	return true;
});
```

### constants/bridge.ts

**Purpose**: Bridge contract ABI and addresses

**Contents**:

- `BRIDGE_ABI` - Smart contract ABI (Application Binary Interface)
- `BRIDGE_CONTRACT_ADDRESSES` - Contract addresses per network

**ABI includes**:

- `claimAsset()` - Claim token transfers
- `claimMessage()` - Claim cross-chain messages

**Example**:

```typescript
export const BRIDGE_ABI = [
	{
		name: "claimAsset",
		type: "function",
		inputs: [
			{ name: "smtProof", type: "bytes32[]" },
			{ name: "rollupSmtProof", type: "bytes32[]" },
			{ name: "globalIndex", type: "uint256" },
			// ... more parameters
		],
		outputs: [],
	},
	// ... more functions
];

export const BRIDGE_CONTRACT_ADDRESSES: Record<number, string> = {
	1: "0x...", // Ethereum mainnet
	137: "0x...", // Polygon
	// ... more networks
};
```

## Configuration

**Environment variables** (loaded in `src/index.ts` or parent consumer config):

**Required**:

- `BRIDGE_HUB_API_URL` - API endpoint
    - Example: `http://localhost:3000` or `https://api.bridge-hub.com`
- `WALLET_PRIVATE_KEY` - Private key for claim transactions
    - Example: `0x...` (64 hex characters)
    - **IMPORTANT**: Keep this secret! Never commit to git
- `RPC_URL` - Blockchain RPC endpoint for destination chain
    - Example: `https://polygon-rpc.com`
- `DESTINATION_NETWORK_ID` - Network ID for claims
    - Example: `137` (Polygon)

**Optional**:

- `POLLING_INTERVAL` - Polling frequency in ms (default: 30000)
- `MAX_GAS_PRICE` - Max gas price willing to pay (in gwei)
- `CLAIM_BATCH_SIZE` - Max transactions to claim per iteration (default: 10)
- `SENTRY_DSN` - Error tracking

**Security note**: Use environment variables or secret management systems (AWS Secrets Manager, HashiCorp Vault) for `WALLET_PRIVATE_KEY`. Never hardcode.

## Running the Service

### Development

```bash
cd packages/auto-claim
bun run dev  # Hot reload enabled
```

### Production

```bash
cd packages/auto-claim
bun run build
bun start  # Runs dist/index.js
```

### Docker

```bash
# From root
docker build -f Dockerfile.autoclaim -t auto-claim .
docker run --env-file .env auto-claim
```

## Transaction Lifecycle

### From Auto-Claim's Perspective

```
1. Transaction has status READY_TO_CLAIM
         ↓
2. Auto-claim fetches from API
         ↓
3. Filters (skip zero-amount MESSAGE)
         ↓
4. Fetches proof from API
         ↓
5. Submits claim to blockchain
         ↓
6. Waits for confirmation
         ↓
7. Consumer detects claim event
         ↓
8. Consumer updates status to CLAIMED
         ↓
9. Auto-claim no longer sees transaction (status filter)
```

## Claim Types

### ASSET Claims (leafType = 0)

**Purpose**: Claim token transfers

**Contract function**: `claimAsset()`

**Flow**:

1. User bridges tokens from Chain A → Chain B
2. Tokens are locked on Chain A
3. Merkle proof becomes available
4. Auto-claim calls `claimAsset()` on Chain B
5. Tokens are minted/released to destination address

**Example transaction**:

```json
{
	"depositCount": 12345,
	"leafType": 0, // ASSET
	"sourceNetwork": 1,
	"destinationNetwork": 137,
	"originAddress": "0xUserA...",
	"destinationAddress": "0xUserA...",
	"tokenAddress": "0xUSDC...",
	"amount": "1000000", // 1 USDC (6 decimals)
	"status": "READY_TO_CLAIM"
}
```

### MESSAGE Claims (leafType = 1)

**Purpose**: Claim cross-chain messages (with optional value)

**Contract function**: `claimMessage()`

**Flow**:

1. User sends cross-chain message from Chain A → Chain B
2. Message data is stored in merkle tree
3. Merkle proof becomes available
4. Auto-claim calls `claimMessage()` on Chain B
5. Message is executed on destination chain

**Example transaction**:

```json
{
	"depositCount": 12346,
	"leafType": 1, // MESSAGE
	"sourceNetwork": 1,
	"destinationNetwork": 137,
	"originAddress": "0xContractA...",
	"destinationAddress": "0xContractB...",
	"amount": "0", // Often zero for pure messages
	"metadata": "0x...", // Encoded function call
	"status": "READY_TO_CLAIM"
}
```

**Auto-claim filter**: Skips MESSAGE transactions with `amount = 0` (configurable behavior).

## Gas Management

### Gas Estimation

Before submitting, auto-claim estimates gas:

```typescript
const gasEstimate = await client.estimateContractGas({
  address: BRIDGE_CONTRACT_ADDRESS,
  abi: BRIDGE_ABI,
  functionName: "claimAsset",
  args: [...],
  account: wallet.account,
});

// Add buffer (e.g., 20%)
const gasLimit = gasEstimate * 120n / 100n;
```

### Gas Price Limits

To avoid overpaying during network congestion:

```typescript
const gasPrice = await client.getGasPrice();

if (gasPrice > MAX_GAS_PRICE) {
	logger.warn("Gas price too high, skipping claim", {
		gasPrice,
		maxGasPrice: MAX_GAS_PRICE,
	});
	return; // Will retry later
}
```

### Insufficient Funds

If wallet lacks funds:

```typescript
try {
  await claimTransaction(...);
} catch (error) {
  if (error.code === "INSUFFICIENT_FUNDS") {
    logger.error("Wallet has insufficient funds", {
      wallet: wallet.account.address,
      network: DESTINATION_NETWORK_ID,
    });
    // Alert monitoring system
  }
}
```

**Solution**: Fund the wallet with native tokens (ETH, MATIC, etc.) for gas.

## Monitoring

### Logs

**Key log events**:

- `Starting auto-claim service` - Service started
- `Fetched ready transactions` - Found transactions to claim
- `Claiming transaction` - Starting claim process
- `Claim successful` - Claim confirmed
- `Claim failed` - Claim error
- `Insufficient funds` - Wallet needs funding
- `Gas price too high` - Skipping due to high gas

**Example logs**:

```typescript
logger.info("Claiming transaction", {
	depositCount: tx.depositCount,
	leafType: tx.leafType,
	amount: tx.amount,
	destinationNetwork: tx.destinationNetwork,
});

logger.info("Claim successful", {
	depositCount: tx.depositCount,
	txHash: receipt.transactionHash,
	gasUsed: receipt.gasUsed,
});
```

### Metrics

Monitor these:

- Claims per hour
- Claim success rate
- Average gas used per claim
- Wallet balance (alert if low)
- API response time
- Claim processing time (fetch → submit → confirm)

### Alerts

Set up alerts for:

- **Low wallet balance** - Fund before running out
- **High claim failure rate** - May indicate RPC issues or contract problems
- **No claims processed in X hours** - Service may be stuck

## Common Development Tasks

### Adding Support for New Network

1. **Add RPC endpoint**:

    ```typescript
    // config or index.ts
    const RPC_URLS: Record<number, string> = {
    	1: "https://eth-mainnet.g.alchemy.com/v2/...",
    	137: "https://polygon-rpc.com",
    	42161: "https://arb1.arbitrum.io/rpc", // Add Arbitrum
    };
    ```

2. **Add bridge contract address**:

    ```typescript
    // constants/bridge.ts
    export const BRIDGE_CONTRACT_ADDRESSES: Record<number, string> = {
    	1: "0x...",
    	137: "0x...",
    	42161: "0x...", // Add Arbitrum address
    };
    ```

3. **Update configuration**:

    ```env
    # .env
    DESTINATION_NETWORK_ID=42161
    RPC_URL=https://arb1.arbitrum.io/rpc
    ```

4. **Test**:
    - Deploy with new network config
    - Monitor logs for claim attempts
    - Verify claims on block explorer

### Changing Claim Filters

**Example**: Claim all MESSAGE transactions (including zero-amount)

```typescript
// services/transaction.ts
export function filterEligibleTransactions(transactions: BridgeTransaction[]) {
	return transactions.filter((tx) => {
		// Remove zero-amount MESSAGE filter
		// Now all READY_TO_CLAIM transactions are eligible
		return true;
	});
}
```

**Example**: Only claim ASSET transactions

```typescript
export function filterEligibleTransactions(transactions: BridgeTransaction[]) {
	return transactions.filter((tx) => {
		return tx.leafType === LeafType.ASSET; // Only ASSET
	});
}
```

### Adding Batch Claiming

**Current behavior**: Claims transactions one at a time

**Enhancement**: Claim multiple transactions in parallel

```typescript
// services/auto-claim.ts
export async function claimBatch(
	transactions: BridgeTransaction[],
	wallet: WalletClient,
	client: PublicClient
) {
	const claimPromises = transactions.map(async (tx) => {
		try {
			const proof = await fetchProof(tx.depositCount);
			await claimTransaction(tx, proof, wallet, client);
		} catch (error) {
			logger.error("Batch claim failed for tx", {
				depositCount: tx.depositCount,
				error,
			});
		}
	});

	await Promise.allSettled(claimPromises);
}
```

**Benefits**: Faster claiming for multiple transactions
**Risks**: Higher gas costs if transactions fail, nonce management complexity

### Implementing Retry Logic

**Current behavior**: Failed claims are retried on next polling cycle

**Enhancement**: Exponential backoff for repeated failures

```typescript
const failureCounts = new Map<number, number>();
const MAX_RETRIES = 5;

export async function claimWithRetry(tx, proof, wallet, client) {
	const failures = failureCounts.get(tx.depositCount) || 0;

	if (failures >= MAX_RETRIES) {
		logger.error("Max retries reached, skipping", {
			depositCount: tx.depositCount,
		});
		return;
	}

	try {
		await claimTransaction(tx, proof, wallet, client);
		failureCounts.delete(tx.depositCount); // Success, reset
	} catch (error) {
		failureCounts.set(tx.depositCount, failures + 1);
		logger.warn("Claim failed, will retry", {
			depositCount: tx.depositCount,
			failures: failures + 1,
			error,
		});
	}
}
```

## Error Scenarios

### Scenario 1: RPC Endpoint Down

**Symptom**: All claims fail with "fetch failed" or "timeout"

**Impact**: No claims processed until RPC recovers

**Solution**:

- Use multiple RPC endpoints with fallback
- Implement RPC health checks
- Alert on repeated failures

### Scenario 2: Wallet Runs Out of Gas

**Symptom**: Claims fail with "insufficient funds"

**Impact**: No claims until wallet is funded

**Solution**:

- Monitor wallet balance
- Alert when balance < threshold
- Auto-fund from treasury (if implemented)

### Scenario 3: Transaction Already Claimed

**Symptom**: Claim fails with "already claimed" error

**Impact**: Wasted gas, error logs

**Cause**: Race condition (multiple claimers) or consumer lag (status not updated yet)

**Solution**:

- Check if claimed before submitting
- Handle "already claimed" gracefully (not an error)
- Improve consumer update speed

### Scenario 4: Invalid Merkle Proof

**Symptom**: Claim transaction reverts with "invalid proof"

**Impact**: Transaction not claimed

**Cause**: Proof not yet finalized, API returned stale proof

**Solution**:

- Verify proof before submitting
- Add proof validation logic
- Query Bridge Service directly for proof verification

## Testing

### Running Tests

```bash
cd packages/auto-claim
bun test
```

### Test Structure

- `tests/services/auto-claim.test.ts` - Claim logic tests
- `tests/services/transaction.test.ts` - Transaction filtering tests
- `tests/test-utils.ts` - Mock helpers

### Mocking

**API fetch**:

```typescript
// test-utils.ts
export const mockApiResponse = {
	success: true,
	data: [
		{
			depositCount: 12345,
			status: "READY_TO_CLAIM",
			leafType: 0,
			amount: "1000000",
			// ...
		},
	],
};

global.fetch = vi.fn(() =>
	Promise.resolve({
		json: () => Promise.resolve(mockApiResponse),
	})
);
```

**viem wallet**:

```typescript
export const mockWallet = {
	writeContract: vi.fn(() => Promise.resolve("0xTxHash...")),
};

export const mockClient = {
	waitForTransactionReceipt: vi.fn(() =>
		Promise.resolve({
			transactionHash: "0xTxHash...",
			status: "success",
			gasUsed: 50000n,
		})
	),
};
```

### Test Cases

**services/transaction.test.ts**:

- `fetchReadyTransactions()` fetches from API
- `filterEligibleTransactions()` excludes zero-amount MESSAGE
- `filterEligibleTransactions()` includes ASSET transactions
- `filterEligibleTransactions()` includes non-zero MESSAGE

**services/auto-claim.test.ts**:

- `claimTransaction()` submits ASSET claim
- `claimTransaction()` submits MESSAGE claim
- `claimTransaction()` handles insufficient funds error
- `claimTransaction()` handles RPC errors
- `startAutoClaim()` loops continuously

## Performance Considerations

### Polling Interval

- **Too short** (< 10s): Unnecessary API load, RPC rate limits
- **Too long** (> 60s): Delayed claims, poor UX
- **Recommended**: 30s for balance of responsiveness and efficiency

### Batch Size

- **Too small** (< 5): Inefficient, many API calls
- **Too large** (> 50): High gas costs, long processing time
- **Recommended**: 10-20 transactions per batch

### Concurrent Claims

Current implementation is **sequential** (one at a time).

For high-throughput scenarios, implement **concurrent claiming** with:

- Nonce management (track pending transactions)
- Gas price adjustment (EIP-1559)
- Error handling per transaction

## Security Considerations

### Private Key Management

**NEVER**:

- Commit private keys to git
- Log private keys
- Expose private keys via API

**DO**:

- Use environment variables
- Use secret management systems (AWS Secrets Manager, Vault)
- Rotate keys regularly
- Use hardware wallets for high-value operations

### Wallet Funding

- Use **dedicated wallet** for auto-claim (not personal funds)
- Fund with **minimal balance** needed for operations
- Implement **balance monitoring** and alerts
- Consider **multi-sig** for funding operations

### Rate Limiting

Auto-claim makes API calls continuously. Implement:

- Respect API rate limits
- Exponential backoff on 429 errors
- Local caching of proofs (if possible)

### Gas Price Protection

Set `MAX_GAS_PRICE` to avoid:

- Overpaying during network congestion
- Draining wallet during gas price spikes

## Troubleshooting

### Issue: No claims being processed

**Check**:

1. Service is running: `ps aux | grep auto-claim`
2. API is accessible: `curl $BRIDGE_HUB_API_URL/transactions`
3. Transactions with READY_TO_CLAIM status exist
4. Wallet has sufficient funds
5. RPC endpoint is accessible

### Issue: Claims fail with "invalid proof"

**Check**:

1. Proof is actually available (query Bridge Service)
2. Proof is finalized (not still pending)
3. API is returning correct proof data
4. globalIndex matches merkle tree

### Issue: High gas costs

**Check**:

1. Gas estimation is accurate
2. Not claiming during high network congestion
3. `MAX_GAS_PRICE` is set appropriately
4. Consider batching claims (if implemented)

### Issue: Transactions claimed twice

**Cause**: Race condition (multiple auto-claim instances)

**Solution**:

- Run only **one instance** per destination network
- Implement distributed locking (Redis, etc.)
- Check transaction status before claiming

## Related Documentation

- **Root claude.md**: Overall architecture
- **packages/commons/claude.md**: Shared types
- **packages/api/claude.md**: API that provides transaction data
- **packages/consumer/claude.md**: Consumer that updates claim status
- **DEPLOYMENT.md**: Production deployment guide

## Key Takeaways

1. Auto-claim **polls API** for READY_TO_CLAIM transactions
2. **Fetches proofs** and **submits claims** to blockchain
3. Handles **ASSET** and **MESSAGE** claim types differently
4. **Filters** zero-amount MESSAGE transactions by default
5. Uses **viem** for blockchain interactions
6. **Gas management** is critical (estimation, price limits, wallet balance)
7. **Error handling** with retries for transient failures
8. **Monitoring** via structured logs and metrics
9. **Security**: Protect private keys, minimal wallet funding
10. Run **one instance per network** to avoid race conditions
