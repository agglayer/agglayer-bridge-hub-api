# Auto-Claim Service

Automated service that claims ready bridge transactions on behalf of users.

## Overview

The Auto-Claim package is the automation layer of the Bridge Hub system. It continuously monitors the Bridge Hub API for transactions that are ready to be claimed, fetches the necessary proofs, and submits claim transactions to the destination blockchain.

**Deployment**: In production, you deploy **one auto-claim instance per destination network** you want to auto-claim for. For the complete cluster architecture and deployment topology, see [ARCHITECTURE.md - Production Cluster Architecture](../../ARCHITECTURE.md#production-cluster-architecture) and [DEPLOYMENT.md - Multi-Network Deployment](../../DEPLOYMENT.md#multi-network-deployment).

## Features

- Automated polling of READY_TO_CLAIM transactions
- Merkle proof fetching and validation
- Support for both ASSET and MESSAGE claim types
- Automatic filtering of zero-amount MESSAGE transactions
- Configurable for multiple source networks
- Comprehensive error handling and retry logic
- Transaction confirmation waiting

## Installation

```bash
# From package directory
bun install
```

## Configuration

Create a `.env` file in the package root with the following variables:

**Required:**

- `BRIDGE_HUB_API_URL` - Bridge Hub API base URL
- `SOURCE_NETWORKS` - Source network IDs to monitor (JSON array)
- `DESTINATION_NETWORK` - Destination network ID for filtering
- `DESTINATION_NETWORK_CHAINID` - Destination chain ID for RPC
- `BRIDGE_CONTRACT` - Bridge contract address
- `PRIVATE_KEY` - Wallet private key for signing transactions
- `RPC_CONFIG` or (`BASE_ERPC_URL` + `ERPC_API_KEY`) - RPC endpoints configuration

**Optional:**

- `SENTRY_DSN` - Error tracking DSN

For detailed configuration with examples, security guidelines, and RPC setup options, see **[DEPLOYMENT.md - Auto-Claim Configuration](../../DEPLOYMENT.md#auto-claim-package)**.

## Usage

### Development

```bash
# Run with hot reload
bun run dev
```

### Production

```bash
# Build
bun run build

# Start
bun start
```

### Testing

```bash
# Run all tests
bun test

# Run with coverage
bun test --coverage
```

## How It Works

### Claim Cycle

The service runs in a continuous loop with a 30-second interval:

```
1. Poll API for READY_TO_CLAIM transactions
   ↓
2. Filter transactions (remove zero-amount MESSAGEs)
   ↓
3. For each transaction:
   ├─ Fetch claim proof from API
   ├─ Compute global index
   ├─ Prepare claim transaction
   ├─ Submit to blockchain
   └─ Wait for confirmation
   ↓
4. Sleep 30 seconds
   ↓
5. Repeat
```

### Transaction Types

#### ASSET Claims

For bridge token transfers:

```typescript
bridge.claimAsset(
	proofLocalExitRoot,
	proofRollupExitRoot,
	globalIndex,
	mainnetExitRoot,
	rollupExitRoot,
	originNetwork,
	originTokenAddress,
	destinationNetwork,
	destinationAddress,
	amount,
	metadata
);
```

#### MESSAGE Claims

For cross-chain messages:

```typescript
bridge.claimMessage(
	proofLocalExitRoot,
	proofRollupExitRoot,
	globalIndex,
	mainnetExitRoot,
	rollupExitRoot,
	originNetwork,
	originAddress,
	destinationNetwork,
	destinationAddress,
	amount,
	metadata
);
```

## Project Structure

```
auto-claim/
├── src/
│   ├── services/
│   │   ├── auto-claim.ts      # Main claiming orchestration
│   │   └── transaction.ts     # API communication
│   ├── constants/
│   │   └── bridge.ts          # Bridge contract ABI
│   └── index.ts               # Entry point
├── tests/
│   ├── services/
│   │   ├── auto-claim.test.ts
│   │   └── transaction.test.ts
│   └── test-utils.ts          # Mocks and helpers
├── dist/                      # Compiled output
└── package.json
```

## Components

### AutoClaimService

Main service that orchestrates the claiming process.

**Key Methods:**

```typescript
// Main entry point - runs claiming loop
async claimTransactions(): Promise<void>

// Claims a single transaction
private async claim(transaction: IHubTransaction): Promise<void>

// Sends claim transaction to blockchain
private async sendTransaction(...params): Promise<void>
```

**Features:**

- Handles both ASSET and MESSAGE types
- Logs detailed information at each step
- Catches and logs errors without crashing
- Waits for transaction confirmation

### TransactionService

Handles communication with the Bridge Hub API.

**Key Methods:**

```typescript
// Fetch transactions ready to claim
async getPendingTransactions(): Promise<IHubTransaction[]>

// Get proof for a specific transaction
async getProof(
  sourceNetwork: number,
  depositCount: number,
  leafIndex: number
): Promise<ClaimProof | null>

// Compute global index for claim
computeGlobalIndex(
  indexLocal: number,
  sourceNetworkId: number
): bigint
```

**Features:**

- Automatic pagination handling
- Filters zero-amount MESSAGE transactions
- Comprehensive error handling
- Null-safe proof validation

## Global Index Calculation

The global index is computed differently based on the source network:

```typescript
// For mainnet (network 0)
globalIndex = (indexLocal + 2) ^ 64;

// For other networks
globalIndex = (indexLocal + (sourceNetworkId - 1) * 2) ^ 32;
```

This ensures unique identifiers across all networks.

## Error Handling

The service includes comprehensive error handling:

### Transaction-Level Errors

Errors during claiming are logged but don't stop the service:

```typescript
try {
	await this.claim(transaction);
} catch (error) {
	Logger.error({
		location: "AutoClaimService.claimTransactions",
		error,
		transaction,
	});
	// Continue with next transaction
}
```

### API Errors

API failures return empty arrays, allowing the service to retry on next poll:

```typescript
// Returns [] on error, service continues
const transactions = await this.transactionService.getPendingTransactions();
```

### Blockchain Errors

Transaction submission errors are caught and logged:

```typescript
try {
  const hash = await bridge.write.claimAsset(...);
  await wallet.waitForTransactionReceipt({ hash });
} catch (error) {
  Logger.error({ location: "sendTransaction", error });
  // Does not throw - continues with next transaction
}
```

## Monitoring

### Structured Logging

All operations are logged with context:

```typescript
// Starting claim cycle
{ location: "AutoClaimService.claimTransactions", call: "started" }

// Transaction submission
{
  location: "AutoClaimService.sendTransaction.start",
  bridgeDetails: {
    transactionHash: "0x...",
    sourceNetwork: 1,
    depositCount: 42
  }
}

// Confirmation
{
  location: "AutoClaimService.sendTransaction.completed",
  message: "claim confirmed: 0x..., status: success"
}

// Errors
{
  location: "AutoClaimService.sendTransaction.error",
  error: {...},
  data: { transactionHash, sourceNetwork, depositCount }
}
```

### Metrics to Monitor

- Number of transactions claimed per cycle
- Time to claim each transaction
- Gas costs per claim
- Error rates and types
- API response times

## Testing

The package includes 39 comprehensive tests:

### TransactionService Tests (22 tests)

- API pagination handling
- Proof fetching and validation
- Global index computation
- Error handling
- Network configuration
- Zero-amount filtering

### AutoClaimService Tests (17 tests)

- Full claiming flow
- ASSET and MESSAGE handling
- Proof fetching integration
- Error scenarios
- Empty transaction lists
- Blockchain interaction mocking

### Running Tests

```bash
# All tests
bun test

# Watch mode
bun test --watch

# With coverage
bun test --coverage
```

## Gas Optimization

### Wallet Funding

Ensure the wallet has sufficient native tokens for gas:

```bash
# Check balance
cast balance $WALLET_ADDRESS --rpc-url $RPC_URL

# Monitor gas usage
cast tx $TX_HASH --rpc-url $RPC_URL | grep gasUsed
```

### Gas Price Strategy

The service uses the default gas price from the RPC. For optimization:

```typescript
// Implement custom gas price strategy
const gasPrice = await publicClient.getGasPrice();
const adjustedGasPrice = (gasPrice * 110n) / 100n; // 10% buffer
```

## Deployment

### Docker

```dockerfile
FROM oven/bun:1

WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

CMD ["bun", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  auto-claim:
    build: .
    environment:
      - BRIDGE_HUB_API_URL=http://api:3000
      - SOURCE_NETWORKS=[1,137]
      - DESTINATION_NETWORK=2442
      - DESTINATION_NETWORK_CHAINID=2442
      - BRIDGE_CONTRACT=0x...
      - PRIVATE_KEY=${PRIVATE_KEY}
      - RPC_CONFIG={"2442": "https://..."}
    restart: unless-stopped
    depends_on:
      - api
```

### Multiple Destination Networks

Run separate instances for each destination:

```bash
# Instance for network 2442
DESTINATION_NETWORK=2442 bun start

# Instance for network 1101
DESTINATION_NETWORK=1101 bun start
```

## Performance

### Metrics

- **Polling Interval**: 30 seconds
- **Concurrent Claims**: Sequential (one at a time)
- **API Response Time**: ~100-500ms per request
- **Claim Transaction Time**: ~10-30 seconds (depending on network)
- **Memory Usage**: ~50-100MB

### Optimization Opportunities

1. **Parallel Claims**: Process multiple claims concurrently
2. **Batching**: Batch multiple claims into single transaction (requires contract support)
3. **Gas Price Optimization**: Implement dynamic gas pricing
4. **Faster Polling**: Reduce interval to 10-15 seconds

## Security Considerations

> **Note**: For security vulnerability reporting and Polygon's bug bounty program, see [SECURITY.md](../../SECURITY.md).

### Private Key Management

**⚠️ CRITICAL: Never commit private keys to version control**

Use secure secret management:

```bash
# AWS Secrets Manager
export PRIVATE_KEY=$(aws secretsmanager get-secret-value \
  --secret-id auto-claim-wallet \
  --query SecretString \
  --output text)

# HashiCorp Vault
export PRIVATE_KEY=$(vault kv get -field=private_key secret/auto-claim)

# Kubernetes Secret
kubectl create secret generic auto-claim-secrets \
  --from-literal=private-key=$PRIVATE_KEY
```

### Wallet Security

- Use a dedicated wallet for auto-claim only
- Fund with minimum required balance
- Monitor wallet activity for anomalies
- Rotate keys periodically
- Use hardware wallet for key storage (advanced)

### Access Control

- Restrict API access to auto-claim service only
- Use VPN or private network for communication
- Implement IP whitelisting on API
- Monitor for unauthorized access attempts

## Troubleshooting

### Service not claiming transactions

**Check API connectivity:**

```bash
curl $BRIDGE_HUB_API_URL/transactions?status=READY_TO_CLAIM
```

**Verify transactions exist:**

```bash
curl "$BRIDGE_HUB_API_URL/transactions?destinationNetworkIds=$DESTINATION_NETWORK&status=READY_TO_CLAIM"
```

**Check wallet balance:**

```bash
cast balance <wallet-address> --rpc-url $RPC_URL
```

### Proof fetching fails

- Verify API is generating proofs correctly
- Check `leafIndexForProof` is set on transactions
- Validate `depositCount` is correct
- Ensure proof endpoints are configured in API

### Transaction reverts

Common reasons:

- Already claimed (check transaction status in explorer)
- Invalid proof (verify proof generation)
- Insufficient gas (increase wallet balance)
- Wrong network configuration (verify chain IDs)

**Check transaction:**

```bash
cast tx $TX_HASH --rpc-url $RPC_URL
```

### High gas costs

- Reduce claiming frequency (increase poll interval)
- Implement gas price limits
- Batch claims if contract supports it
- Monitor network congestion

### Memory leaks

- Monitor with `process.memoryUsage()`
- Check for unclosed HTTP connections
- Verify viem client cleanup
- Review logger configuration

## Dependencies

- `@agglayer/bridge-hub-commons` - Shared types
- `@polygonlabs/servercore` - Logging
- `viem` - Blockchain interactions (wallet, contracts)

## Future Enhancements

### Planned Features

1. **Retry Mechanism**: Exponential backoff for failed claims
2. **Priority Queue**: Claim high-value transactions first
3. **Gas Optimization**: Batch multiple claims
4. **Multi-sig Support**: Support for multi-signature wallets
5. **Webhooks**: Notify external systems of claims
6. **Dashboard**: Real-time monitoring UI
7. **Analytics**: Track claim statistics and costs

### Configuration Improvements

- Configurable poll interval
- Maximum gas price limits
- Minimum transaction value threshold
- Concurrent claim limits

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) in the repository root.

## License

See [LICENSE](../../LICENSE) in the repository root.
