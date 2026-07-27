# Deployment Guide

This document provides comprehensive guidance for deploying the Agglayer Bridge Hub to production environments.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Setup](#environment-setup)
- [Building for Production](#building-for-production)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Monitoring and Logging](#monitoring-and-logging)
- [Backup and Recovery](#backup-and-recovery)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)
- [Security Checklist](#security-checklist)

## Prerequisites

### Infrastructure Requirements

- **Compute**:
    - API: 2+ vCPU, 4GB RAM (per instance)
    - Consumer: 2+ vCPU, 4GB RAM (per network)
    - Auto-Claim: 1+ vCPU, 2GB RAM (per destination)

- **Database**:
    - MongoDB >= 4.4
    - Recommended: 3-node replica set
    - Storage: 100GB+ (grows with transaction volume)

- **Network**:
    - Stable RPC endpoint access
    - Outbound HTTPS (443) for Bridge Service API
    - Load balancer for API (optional but recommended)

### Software Requirements

- Bun >= 1.0.0
- Docker (optional, for containerized deployment)
- Kubernetes (optional, for orchestrated deployment)
- MongoDB client tools

### External Services

- Bridge Service API access
- Blockchain RPC endpoints (reliable providers)
- Sentry account (optional, for error tracking)

## Environment Setup

### 1. MongoDB Setup

#### Local Development

```bash
# Start MongoDB with Docker
docker run -d \
  --name bridge-hub-mongo \
  -p 27017:27017 \
  -v mongo-data:/data/db \
  mongo:7

# Or use MongoDB Atlas (cloud)
# https://www.mongodb.com/cloud/atlas
```

#### Production

**Recommended: MongoDB Atlas** (managed service)

Or self-hosted replica set:

```bash
# Install MongoDB on 3 servers
# Configure replica set in mongod.conf:
replication:
  replSetName: "bridge-hub"

# Initialize replica set
mongosh
> rs.initiate({
    _id: "bridge-hub",
    members: [
      { _id: 0, host: "mongo1.example.com:27017" },
      { _id: 1, host: "mongo2.example.com:27017" },
      { _id: 2, host: "mongo3.example.com:27017" }
    ]
  })
```

**Create Database and Indexes**:

```javascript
use bridge_hub;

// Transactions collection indexes
db.transactions.createIndex({ hubUID: 1 }, { unique: true });
db.transactions.createIndex({ status: 1 });
db.transactions.createIndex({ sourceNetwork: 1, destinationNetwork: 1 });
db.transactions.createIndex({ depositCount: 1 });
db.transactions.createIndex({ status: 1, destinationNetwork: 1 });

// Token mappings indexes
db.token_mappings.createIndex({
  originNetwork: 1,
  originTokenAddress: 1,
  destinationNetwork: 1
});
```

### 2. Secret Management

**Never commit secrets to repository!**

#### Using AWS Secrets Manager

```bash
# Store secrets
aws secretsmanager create-secret \
  --name bridge-hub/auto-claim/private-key \
  --secret-string "0x..."

# Retrieve in application
export PRIVATE_KEY=$(aws secretsmanager get-secret-value \
  --secret-id bridge-hub/auto-claim/private-key \
  --query SecretString \
  --output text)
```

#### Using HashiCorp Vault

```bash
# Store secrets
vault kv put secret/bridge-hub/auto-claim \
  private_key="0x..."

# Retrieve in application
export PRIVATE_KEY=$(vault kv get -field=private_key \
  secret/bridge-hub/auto-claim)
```

#### Using Kubernetes Secrets

```yaml
apiVersion: v1
kind: Secret
metadata:
    name: bridge-hub-secrets
type: Opaque
stringData:
    mongodb-uri: "mongodb://user:pass@mongo:27017/bridge_hub"
    private-key: "0x..."
    sentry-dsn: "https://...@sentry.io/..."
```

## Building for Production

### Build All Packages

```bash
# From repository root
bun install
bun run build
```

This creates production builds in each package's `dist/` directory:

- `packages/api/dist/`
- `packages/consumer/dist/`
- `packages/auto-claim/dist/`

### Verify Builds

```bash
# Check build outputs
ls -la packages/*/dist/

# Test production build
cd packages/api
NODE_ENV=production bun dist/server.js
```

## Deployment Options

### Option 1: Traditional VMs

#### Setup

1. **Provision VMs**:
    - 1 VM for API (or more behind load balancer)
    - 1 VM per network for Consumer
    - 1 VM per destination for Auto-Claim

2. **Install Bun**:

```bash
curl -fsSL https://bun.sh/install | bash
```

3. **Deploy Code**:

```bash
# On each VM
git clone <repository>
cd agglayer-bridge-hub-api
bun install
bun run build
```

4. **Configure Systemd Services**:

**API Service** (`/etc/systemd/system/bridge-hub-api.service`):

```ini
[Unit]
Description=Bridge Hub API
After=network.target

[Service]
Type=simple
User=bridge-hub
WorkingDirectory=/opt/bridge-hub/packages/api
Environment="NODE_ENV=production"
EnvironmentFile=/etc/bridge-hub/api.env
ExecStart=/home/bridge-hub/.bun/bin/bun dist/server.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Consumer Service** (`/etc/systemd/system/bridge-hub-consumer.service`):

```ini
[Unit]
Description=Bridge Hub Consumer
After=network.target

[Service]
Type=simple
User=bridge-hub
WorkingDirectory=/opt/bridge-hub/packages/consumer
Environment="NODE_ENV=production"
EnvironmentFile=/etc/bridge-hub/consumer.env
ExecStart=/home/bridge-hub/.bun/bin/bun dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

5. **Start Services**:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bridge-hub-api
sudo systemctl start bridge-hub-api
sudo systemctl status bridge-hub-api
```

### Option 2: Docker Containers

The repository includes production-ready Dockerfiles for all services located at the repository root.

#### Available Dockerfiles

- `Dockerfile.api` - API service (exposes port 3001)
- `Dockerfile.consumer` - Consumer service
- `Dockerfile.autoclaim` - Auto-claim service

Each Dockerfile:

- Uses `oven/bun:1.2-alpine` for minimal image size
- Implements multi-stage builds (builder + runtime)
- Runs as non-root user (`bunuser`) for security
- Properly handles monorepo structure with commons package

#### Building Docker Images

Build each service from the repository root:

```bash
# Build all images
docker build -f Dockerfile.api -t bridge-hub-api:latest .
docker build -f Dockerfile.consumer -t bridge-hub-consumer:latest .
docker build -f Dockerfile.autoclaim -t bridge-hub-autoclaim:latest .
```

#### Docker Compose Deployment

Create a `docker-compose.yml` file in the repository root:

```yaml
version: "3.8"

services:
    mongodb:
        image: mongo:7
        volumes:
            - mongo-data:/data/db
        environment:
            MONGO_INITDB_ROOT_USERNAME: ${MONGO_USER}
            MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
        ports:
            - "27017:27017"
        restart: unless-stopped
        networks:
            - bridge-hub

    api:
        build:
            context: .
            dockerfile: Dockerfile.api
        ports:
            - "3001:3001"
        environment:
            NODE_ENV: production
            MONGODB_CONNECTION_URI: ${MONGODB_CONNECTION_URI}
            MONGODB_DB_NAME: ${MONGODB_DB_NAME}
            PROOF_CONFIG: ${PROOF_CONFIG}
            RPC_CONFIG: ${RPC_CONFIG}
            SENTRY_DSN: ${SENTRY_DSN}
        depends_on:
            - mongodb
        restart: unless-stopped
        networks:
            - bridge-hub

    consumer-net1:
        build:
            context: .
            dockerfile: Dockerfile.consumer
        environment:
            NODE_ENV: production
            NETWORK_ID: ${CONSUMER_NETWORK_ID}
            NETWORK: ${CONSUMER_NETWORK}
            BRIDGE_SERVICE_URL: ${BRIDGE_SERVICE_URL}
            BRIDGE_CONTRACT_ADDRESS: ${BRIDGE_CONTRACT_ADDRESS}
            MONGODB_CONNECTION_URI: ${MONGODB_CONNECTION_URI}
            MONGODB_DB_NAME: ${MONGODB_DB_NAME}
            SENTRY_DSN: ${SENTRY_DSN}
        depends_on:
            - mongodb
        restart: unless-stopped
        networks:
            - bridge-hub

    autoclaim:
        build:
            context: .
            dockerfile: Dockerfile.autoclaim
        environment:
            NODE_ENV: production
            BRIDGE_HUB_API_URL: http://api:3001
            SOURCE_NETWORKS: ${SOURCE_NETWORKS}
            DESTINATION_NETWORK: ${DESTINATION_NETWORK}
            DESTINATION_NETWORK_CHAINID: ${DESTINATION_NETWORK_CHAINID}
            BRIDGE_CONTRACT: ${BRIDGE_CONTRACT}
            PRIVATE_KEY: ${PRIVATE_KEY}
            RPC_CONFIG: ${RPC_CONFIG}
            SENTRY_DSN: ${SENTRY_DSN}
        depends_on:
            - api
        restart: unless-stopped
        networks:
            - bridge-hub

volumes:
    mongo-data:

networks:
    bridge-hub:
        driver: bridge
```

**Setup and Deployment**:

```bash
# Create .env file in repository root
# Docker Compose automatically picks up this file
touch .env

# Start all services
docker-compose up -d

# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f api

# Check service status
docker-compose ps

# Restart a service
docker-compose restart api

# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

**Adding Multiple Consumer Instances**:

For multi-network deployments, add additional consumer services to the docker-compose.yml:

```yaml
consumer-net137:
    build:
        context: .
        dockerfile: Dockerfile.consumer
    environment:
        NETWORK_ID: 137
        NETWORK: mainnet
        BRIDGE_SERVICE_URL: ${BRIDGE_SERVICE_URL_NET137}
        BRIDGE_CONTRACT_ADDRESS: ${BRIDGE_CONTRACT_ADDRESS_NET137}
        MONGODB_CONNECTION_URI: ${MONGODB_CONNECTION_URI}
        MONGODB_DB_NAME: ${MONGODB_DB_NAME}
    depends_on:
        - mongodb
    restart: unless-stopped
    networks:
        - bridge-hub
```

### Option 3: Kubernetes

#### Namespace and ConfigMap

```yaml
apiVersion: v1
kind: Namespace
metadata:
    name: bridge-hub
---
apiVersion: v1
kind: ConfigMap
metadata:
    name: bridge-hub-config
    namespace: bridge-hub
data:
    MONGODB_DB_NAME: "bridge_hub"
    NODE_ENV: "production"
```

#### API Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
    name: bridge-hub-api
    namespace: bridge-hub
spec:
    replicas: 3
    selector:
        matchLabels:
            app: bridge-hub-api
    template:
        metadata:
            labels:
                app: bridge-hub-api
        spec:
            containers:
                - name: api
                  image: bridge-hub-api:latest
                  ports:
                      - containerPort: 3000
                  env:
                      - name: MONGODB_CONNECTION_URI
                        valueFrom:
                            secretKeyRef:
                                name: bridge-hub-secrets
                                key: mongodb-uri
                      - name: MONGODB_DB_NAME
                        valueFrom:
                            configMapKeyRef:
                                name: bridge-hub-config
                                key: MONGODB_DB_NAME
                  resources:
                      requests:
                          memory: "2Gi"
                          cpu: "1000m"
                      limits:
                          memory: "4Gi"
                          cpu: "2000m"
                  livenessProbe:
                      httpGet:
                          path: /health
                          port: 3000
                      initialDelaySeconds: 30
                      periodSeconds: 10
                  readinessProbe:
                      httpGet:
                          path: /health
                          port: 3000
                      initialDelaySeconds: 5
                      periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
    name: bridge-hub-api
    namespace: bridge-hub
spec:
    selector:
        app: bridge-hub-api
    ports:
        - port: 80
          targetPort: 3000
    type: LoadBalancer
```

**Deploy to Kubernetes**:

```bash
# Apply configurations
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/consumer-deployment.yaml
kubectl apply -f k8s/auto-claim-deployment.yaml

# Check status
kubectl get pods -n bridge-hub
kubectl logs -f -n bridge-hub deployment/bridge-hub-api

# Scale API
kubectl scale deployment bridge-hub-api --replicas=5 -n bridge-hub
```

## Configuration

### Environment Variables by Package

#### API Package

| Variable                 | Required | Example                           | Description                |
| ------------------------ | -------- | --------------------------------- | -------------------------- |
| `MONGODB_CONNECTION_URI` | Yes      | `mongodb://user:pass@host:27017`  | MongoDB connection string  |
| `MONGODB_DB_NAME`        | Yes      | `bridge_hub`                      | Database name              |
| `RPC_CONFIG`             | Yes      | `{"mainnet":{"1":"https://..."}}` | RPC endpoints by network   |
| `PROOF_CONFIG`           | Yes      | `{"mainnet":{"1":"https://..."}}` | Proof generation endpoints |
| `PORT`                   | No       | `3000`                            | HTTP port (default: 3000)  |
| `NODE_ENV`               | No       | `production`                      | Environment                |
| `SENTRY_DSN`             | No       | `https://...@sentry.io/...`       | Error tracking             |

#### Consumer Package

| Variable                    | Required | Example                                 | Description                           |
| --------------------------- | -------- | --------------------------------------- | ------------------------------------- |
| `NETWORK_ID`                | Yes      | `1`                                     | Network identifier                    |
| `NETWORK`                   | Yes      | `mainnet`                               | Network name (mainnet/testnet/devnet) |
| `BRIDGE_SERVICE_URL`        | Yes      | `https://bridge-api.polygon.technology` | Bridge Service API                    |
| `BRIDGE_CONTRACT_ADDRESS`   | Yes      | `0x...`                                 | Bridge contract address               |
| `MONGODB_CONNECTION_URI`    | Yes      | `mongodb://user:pass@host:27017`        | MongoDB connection string             |
| `MONGODB_DB_NAME`           | Yes      | `bridge_hub`                            | Database name                         |
| `ETROG_UPDATE_BLOCK_NUMBER` | No       | `0`                                     | Starting block                        |
| `SENTRY_DSN`                | No       | `https://...@sentry.io/...`             | Error tracking                        |

#### Auto-Claim Package

| Variable                      | Required | Example                     | Description                     |
| ----------------------------- | -------- | --------------------------- | ------------------------------- |
| `BRIDGE_HUB_API_URL`          | Yes      | `http://api:3000`           | Bridge Hub API URL              |
| `SOURCE_NETWORKS`             | Yes      | `[1,137]`                   | Source network IDs (JSON array) |
| `DESTINATION_NETWORK`         | Yes      | `2442`                      | Destination network ID          |
| `DESTINATION_NETWORK_CHAINID` | Yes      | `2442`                      | Destination chain ID            |
| `BRIDGE_CONTRACT`             | Yes      | `0x...`                     | Bridge contract address         |
| `PRIVATE_KEY`                 | Yes      | `0x...`                     | Wallet private key              |
| `RPC_CONFIG`                  | Yes      | `{"2442":"https://..."}`    | RPC endpoints (JSON)            |
| `SENTRY_DSN`                  | No       | `https://...@sentry.io/...` | Error tracking                  |

### Configuration Best Practices

1. **Use Secret Management**: Never store secrets in plain text
2. **Separate Environments**: Different configs for dev/staging/prod
3. **Validate on Startup**: Check all required variables are set
4. **Document Defaults**: Clear documentation of default values
5. **Version Control**: Config templates in git, secrets elsewhere

## Monitoring and Logging

### Sentry Integration

Configure Sentry for error tracking:

```bash
# Set Sentry DSN in environment
export SENTRY_DSN="https://...@sentry.io/..."
```

All errors are automatically reported with context.

### Logging

Structured JSON logs for production:

```json
{
	"level": "info",
	"message": "...",
	"location": "Service.method",
	"timestamp": "2024-01-27T10:00:00Z",
	"data": {
		/* context */
	}
}
```

**Centralized Logging** (ELK Stack):

```yaml
# Filebeat configuration
filebeat.inputs:
    - type: container
      paths:
          - "/var/lib/docker/containers/*/*.log"

output.elasticsearch:
    hosts: ["elasticsearch:9200"]
```

### Prometheus Metrics

Add metrics endpoint (future enhancement):

```typescript
import { register, Counter, Histogram } from "prom-client";

const httpRequestCounter = new Counter({
	name: "http_requests_total",
	help: "Total HTTP requests",
	labelNames: ["method", "path", "status"],
});

app.get("/metrics", (c) => {
	return c.text(register.metrics());
});
```

### Health Checks

**API Health Check**:

```bash
curl http://api:3000/health
```

**Load Balancer Health Check**:

```
GET /health every 30 seconds
Timeout: 5 seconds
Healthy threshold: 2 consecutive successes
Unhealthy threshold: 3 consecutive failures
```

## Backup and Recovery

### Database Backups

**Automated Backups** (daily):

```bash
#!/bin/bash
# backup.sh
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

mongodump \
  --uri="mongodb://user:pass@host:27017/bridge_hub" \
  --out="$BACKUP_DIR/bridge_hub_$DATE" \
  --gzip

# Upload to S3
aws s3 sync "$BACKUP_DIR/bridge_hub_$DATE" \
  "s3://bridge-hub-backups/bridge_hub_$DATE"

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -mtime +30 -delete
```

**Restore from Backup**:

```bash
mongorestore \
  --uri="mongodb://user:pass@host:27017" \
  --gzip \
  /backups/bridge_hub_20240127/
```

### Disaster Recovery Plan

1. **Database Failure**:
    - Promote MongoDB replica to primary
    - Or restore from latest backup

2. **API Failure**:
    - Load balancer routes to healthy instances
    - Auto-scaling adds new instances

3. **Consumer Failure**:
    - Automatic restart via systemd/Kubernetes
    - Catches up from last indexed deposit count

4. **Auto-Claim Failure**:
    - Automatic restart
    - Re-processes unclaimed transactions

## Multi-Network Deployment

### Architecture Overview

The Bridge Hub is designed to index multiple blockchain networks simultaneously. See [ARCHITECTURE.md - Production Cluster Architecture](./ARCHITECTURE.md#production-cluster-architecture) for detailed architecture diagrams and component interactions.

### Deployment Topology

**Consumer Instances: One per Source Network**

Deploy one consumer instance for each blockchain network you want to index:

```bash
# Network 0 (Ethereum)
NETWORK_ID=0 NETWORK=mainnet BRIDGE_CONTRACT_ADDRESS=0x... bun start

# Network 1 (zkEVM)
NETWORK_ID=1 NETWORK=mainnet BRIDGE_CONTRACT_ADDRESS=0x... bun start

# Network 137 (Polygon PoS)
NETWORK_ID=137 NETWORK=mainnet BRIDGE_CONTRACT_ADDRESS=0x... bun start
```

Each consumer connects to its network's Aggkit Bridge Service and writes to the shared MongoDB database.

**Auto-Claim Instances: One per Destination Network**

Deploy one auto-claim instance for each destination network you want to auto-claim for:

```bash
# Auto-claim for network 2442 (Cardona testnet)
DESTINATION_NETWORK=2442 \
DESTINATION_NETWORK_CHAINID=2442 \
SOURCE_NETWORKS=[0,1,137] \
bun start

# Auto-claim for network 1101 (Polygon zkEVM mainnet)
DESTINATION_NETWORK=1101 \
DESTINATION_NETWORK_CHAINID=1101 \
SOURCE_NETWORKS=[0,1,137] \
bun start
```

**API Service: Single Instance (Horizontally Scalable)**

Deploy one API instance that serves all networks:

```bash
# API serves data from all networks in the database
PORT=3000 \
MONGODB_CONNECTION_URI=mongodb://... \
RPC_CONFIG='{"mainnet":{"0":"https://...","1":"https://...","137":"https://..."}}' \
PROOF_CONFIG='{"mainnet":{"0":"https://...","1":"https://...","137":"https://..."}}' \
bun start
```

**MongoDB: Single Shared Database**

All consumers and the API share one MongoDB instance:

```
MongoDB (Shared)
├── bridge_hub_api_transactions (all networks)
├── bridge_hub_api_mappings (all networks)
└── bridge_hub_api_metadata (per-network checkpoints)
```

### Example Production Deployment

**For 3 Networks (Ethereum, zkEVM, Polygon):**

| Component              | Instances          | Configuration              |
| ---------------------- | ------------------ | -------------------------- |
| Consumer (net 0)       | 1                  | `NETWORK_ID=0`             |
| Consumer (net 1)       | 1                  | `NETWORK_ID=1`             |
| Consumer (net 137)     | 1                  | `NETWORK_ID=137`           |
| API                    | 2+ (load balanced) | Serves all networks        |
| Auto-Claim (dest 2442) | 1                  | `DESTINATION_NETWORK=2442` |
| Auto-Claim (dest 1101) | 1                  | `DESTINATION_NETWORK=1101` |
| MongoDB                | 1 (replica set)    | Shared by all              |

**Total: 8 services + 1 database**

### Adding a New Network

To add support for a new network to your deployment:

1. **Deploy Consumer Instance**

    ```bash
    # Add consumer for new network (e.g., network 42161 - Arbitrum)
    NETWORK_ID=42161 \
    NETWORK=mainnet \
    BRIDGE_CONTRACT_ADDRESS=0x... \
    BRIDGE_SERVICE_URL=https://aggkit-42161.example.com \
    MONGODB_CONNECTION_URI=mongodb://... \
    bun start
    ```

2. **Update API Configuration**
    - Add network's RPC endpoint to `RPC_CONFIG`
    - Add network's proof endpoint to `PROOF_CONFIG`
    - Restart API instances

3. **Update Auto-Claim Configuration**
    - Add new network ID to `SOURCE_NETWORKS` array
    - Restart auto-claim instances

4. **Verify Data Flow**
    - Check consumer is indexing: Query metadata collection for network checkpoint
    - Check API serves data: `GET /transactions?sourceNetworkIds=42161`
    - Check auto-claim detects transactions: Monitor auto-claim logs

### Network Configuration

Networks are identified by their chain ID. Common networks:

| Network ID | Network Name     | Type      | Common Use                                    |
| ---------- | ---------------- | --------- | ---------------------------------------------- |
| 0          | Ethereum Mainnet | L1        | Source for bridges to L2s                      |
| 1          | zkEVM Mainnet    | L2        | Polygon zkEVM — **decommissioned**, network sunset |
| 137        | Polygon PoS      | Sidechain | Polygon PoS chain                              |
| 2442       | Cardona Testnet  | L2        | zkEVM testnet — **decommissioned**, network sunset |
| 1101       | Polygon zkEVM    | L2        | zkEVM mainnet (alternative ID) — **decommissioned**, network sunset |
| 42161      | Arbitrum One     | L2        | Arbitrum mainnet                               |

**Note**: Actual network IDs depend on Agglayer configuration. Check with network operators for canonical IDs. zkEVM mainnet and its Cardona testnet are retained here only as illustrative examples elsewhere in this doc — do not deploy new consumer/auto-claim instances for them.

### Resource Requirements Per Network

**Consumer (per network):**

- CPU: 2+ vCPU
- RAM: 4GB
- Storage: 50GB (grows with transaction history)
- Network: High bandwidth for Aggkit polling

**API (shared):**

- CPU: 4+ vCPU
- RAM: 8GB
- Storage: Minimal (reads from DB)
- Network: High bandwidth for API requests

**Auto-Claim (per destination network):**

- CPU: 1-2 vCPU
- RAM: 2GB
- Storage: Minimal
- Funds: Native tokens for gas on destination chain

## Scaling

### Horizontal Scaling

**API**: Add more instances behind load balancer

```bash
# Kubernetes
kubectl scale deployment bridge-hub-api --replicas=5

# Docker
docker-compose up --scale api=5
```

**Consumer**: Run one instance per source network

```bash
# Network 1 (Ethereum)
NETWORK_ID=1 NETWORK=mainnet bun start

# Network 137 (Polygon)
NETWORK_ID=137 NETWORK=mainnet bun start
```

**Auto-Claim**: Run one instance per destination

```bash
# Destination 2442
DESTINATION_NETWORK=2442 bun start

# Destination 1101
DESTINATION_NETWORK=1101 bun start
```

### Vertical Scaling

**Increase Resources**:

```yaml
# Kubernetes
resources:
    requests:
        memory: "4Gi"
        cpu: "2000m"
    limits:
        memory: "8Gi"
        cpu: "4000m"
```

### Database Scaling

**Read Replicas**:

```javascript
// API reads from replica
const readUri =
	"mongodb://replica1,replica2/bridge_hub?readPreference=secondary";

// Consumer writes to primary
const writeUri = "mongodb://primary/bridge_hub";
```

## Troubleshooting

### Common Issues

#### 1. MongoDB Connection Failures

**Symptoms**: Services crash with connection errors

**Solutions**:

- Check MongoDB is running: `mongosh $MONGODB_CONNECTION_URI`
- Verify credentials in environment variables
- Check network connectivity: `telnet mongo-host 27017`
- Review MongoDB logs for errors

#### 2. API Returning Empty Results

**Symptoms**: API queries return no data

**Solutions**:

- Check Consumer is running and indexing
- Verify MongoDB contains data: `db.transactions.count()`
- Check API logs for errors
- Verify query parameters are correct

#### 3. Auto-Claim Not Claiming

**Symptoms**: Transactions stuck in READY_TO_CLAIM

**Solutions**:

- Check wallet has sufficient gas
- Verify API_URL is accessible from auto-claim
- Check RPC endpoint connectivity
- Review auto-claim logs for errors
- Verify private key is correct

#### 4. High Memory Usage

**Symptoms**: Services using excessive memory

**Solutions**:

- Check for memory leaks in logs
- Reduce batch sizes in Consumer
- Increase poll intervals
- Add memory limits in Docker/Kubernetes

### Debug Mode

Enable debug logging:

```bash
export LOG_LEVEL=debug
bun start
```

## Security Checklist

> **Note**: For security vulnerability reporting and Polygon's bug bounty program, see [SECURITY.md](./SECURITY.md).

### Pre-Deployment

- [ ] All secrets stored in secret management system
- [ ] MongoDB authentication enabled
- [ ] MongoDB network isolation configured
- [ ] RPC endpoints use HTTPS
- [ ] API rate limiting implemented
- [ ] CORS configured for production origins
- [ ] Sentry DSN configured for error tracking
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates installed
- [ ] Backup strategy implemented

### Post-Deployment

- [ ] Monitor logs for suspicious activity
- [ ] Regular security updates applied
- [ ] Access logs reviewed periodically
- [ ] Backup restoration tested
- [ ] Disaster recovery plan documented
- [ ] On-call rotation established

### Ongoing Maintenance

- [ ] Weekly dependency updates
- [ ] Monthly security audits
- [ ] Quarterly disaster recovery drills
- [ ] Annual penetration testing

## Conclusion

This deployment guide provides a comprehensive overview of deploying the Agglayer Bridge Hub to production. Choose the deployment option that best fits your infrastructure and requirements.

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

For development guidelines, see [CONTRIBUTING.md](./CONTRIBUTING.md).

For support, open an issue in the repository or contact the team.
