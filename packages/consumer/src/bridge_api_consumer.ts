import { JsonRpcConsumer } from "bridge-hub-commons/consumer/json_rpc_consumer";
import type { ConsumerError } from "bridge-hub-commons/errors/consumer_errors";
import type { ExternalDependencyError } from "bridge-hub-commons/errors/external_dependency_error";
import type { JSONRPCClient } from "bridge-hub-commons/helpers/json_rpc_client";
import type {
    IBridgesBridgeAPIResult,
    IBridgeTx,
} from "bridge-hub-commons/interfaces/bridge_tx";
import type {
    IClaimsBridgeAPIResult,
    IClaimTx,
} from "bridge-hub-commons/interfaces/claim_tx";
import type { IConsumerConfig } from "bridge-hub-commons/interfaces/consumer_config";
import type {
    IMappingsBridgeAPIResult,
    IMappingTx,
} from "bridge-hub-commons/interfaces/token_mapping";

export class BridgeAPIConsumer {
    private bridgeConsumer: JsonRpcConsumer<
        IBridgesBridgeAPIResult,
        IBridgeTx
    > | null = null;
    private claimConsumer: JsonRpcConsumer<
        IClaimsBridgeAPIResult,
        IClaimTx
    > | null = null;
    private mappingConsumer: JsonRpcConsumer<
        IMappingsBridgeAPIResult,
        IMappingTx
    > | null = null;

    constructor(
        private consumerRpcClient: JSONRPCClient,
        private bridgeConsumerConfig: IConsumerConfig,
        private claimConsumerConfig: IConsumerConfig,
        private mappingConsumerConfig: IConsumerConfig
    ) {}

    public async start(): Promise<void> {
        this.bridgeConsumer = new JsonRpcConsumer<
            IBridgesBridgeAPIResult,
            IBridgeTx
        >(
            this.consumerRpcClient,
            this.bridgeConsumerConfig,
            (data: IBridgesBridgeAPIResult) =>
                this.getBridgesFromApiResult(data)
        );
        this.claimConsumer = new JsonRpcConsumer<
            IClaimsBridgeAPIResult,
            IClaimTx
        >(
            this.consumerRpcClient,
            this.claimConsumerConfig,
            (data: IClaimsBridgeAPIResult) => this.getClaimFromApiResult(data)
        );
        this.mappingConsumer = new JsonRpcConsumer<
            IMappingsBridgeAPIResult,
            IMappingTx
        >(
            this.consumerRpcClient,
            this.mappingConsumerConfig,
            (data: IMappingsBridgeAPIResult) =>
                this.getMappingsFromApiResult(data)
        );

        await Promise.all([
            this.bridgeConsumer.start({
                next: async (data) => this.onBridgeData(data as IBridgeTx[]),
                error: (err: ConsumerError | ExternalDependencyError) =>
                    this.onError(err),
                closed: () => this.onClosed("Bridge"),
            }),
            this.claimConsumer.start({
                next: async (data) => this.onClaimData(data as IClaimTx[]),
                error: (err: ConsumerError | ExternalDependencyError) =>
                    this.onError(err),
                closed: () => this.onClosed("Claim"),
            }),
            this.mappingConsumer.start({
                next: async (data) => this.onMappingData(data as IMappingTx[]),
                error: (err: ConsumerError | ExternalDependencyError) =>
                    this.onError(err),
                closed: () => this.onClosed("Mappings"),
            }),
        ]);
    }

    private getBridgesFromApiResult(
        result: IBridgesBridgeAPIResult
    ): IBridgeTx[] {
        return result.bridges;
    }
    private getClaimFromApiResult(result: IClaimsBridgeAPIResult): IClaimTx[] {
        return result.claims;
    }
    private getMappingsFromApiResult(
        result: IMappingsBridgeAPIResult
    ): IMappingTx[] {
        return result.tokenMappings;
    }

    private onBridgeData(data: IBridgeTx[]): void {
        // Process bridge data
    }
    private onClaimData(data: IClaimTx[]): void {
        // Process claim data
    }
    private onMappingData(data: IMappingTx[]): void {
        // Process mapping data
    }

    private onError(err: Error): void {
        console.error("Consumer error:", err);
    }

    private onClosed(consumerName: string): void {
        console.warn(`${consumerName} consumer has closed.`);
    }
}
