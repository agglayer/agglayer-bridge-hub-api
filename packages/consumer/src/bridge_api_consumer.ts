import { JsonRpcConsumer } from "bridge-hub-commons/consumer/json_rpc_consumer";
import {
    ConsumerError,
    ExternalDependencyError,
    DatabaseError,
} from "bridge-hub-commons/errors";
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
import type TokenMappingsMapper from "./mappers/mapping";
import type TransactionMapper from "./mappers/transaction";
import type TokenMappingsService from "./services/mapping";
import type TransactionsService from "./services/transaction";
import { Logger } from "bridge-hub-commons/helpers/logger";
import { errorCodes } from "bridge-hub-commons/constants/error_codes";
import type MetadataService from "./services/metadata";
import type { ILastIndexedTransaction } from "bridge-hub-commons/interfaces/metadata";
import type MetadataMapper from "./mappers/metadata";

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
        private mappingConsumerConfig: IConsumerConfig,
        private transactionMapper: TransactionMapper,
        private tokenMappingsMapper: TokenMappingsMapper,
        private metadataMapper: MetadataMapper,
        private transactionService: TransactionsService,
        private tokenMappingsService: TokenMappingsService,
        private metadataService: MetadataService
    ) {}

    public async start(): Promise<void> {
        const metadata = await this.metadataService.getLastIndexedTxs();

        this.bridgeConsumer = new JsonRpcConsumer<
            IBridgesBridgeAPIResult,
            IBridgeTx
        >(
            this.consumerRpcClient,
            this.bridgeConsumerConfig,
            (data: IBridgesBridgeAPIResult) =>
                this.getBridgesFromApiResult(data),
            metadata?.lastIndexedBridgeTxHash ?? null,
            metadata?.lastIndexedBridgeBlockNumber ?? 0
        );
        this.claimConsumer = new JsonRpcConsumer<
            IClaimsBridgeAPIResult,
            IClaimTx
        >(
            this.consumerRpcClient,
            this.claimConsumerConfig,
            (data: IClaimsBridgeAPIResult) => this.getClaimFromApiResult(data),
            metadata?.lastIndexedClaimTxHash ?? null,
            metadata?.lastIndexedClaimBlockNumber ?? 0
        );
        this.mappingConsumer = new JsonRpcConsumer<
            IMappingsBridgeAPIResult,
            IMappingTx
        >(
            this.consumerRpcClient,
            this.mappingConsumerConfig,
            (data: IMappingsBridgeAPIResult) =>
                this.getMappingsFromApiResult(data),
            metadata?.lastIndexedMappingTxHash ?? null,
            metadata?.lastIndexedMappingBlockNumber ?? 0
        );

        await Promise.all([
            this.bridgeConsumer.start({
                next: async (data) => this.onBridgeData(data as IBridgeTx[]),
                summary: async (data: ILastIndexedTransaction) =>
                    this.onBridgeDataSummary(data),
                error: (err: ConsumerError | ExternalDependencyError) =>
                    this.onError(this.bridgeConsumerConfig.name, err),
                closed: () => this.onClosed(this.bridgeConsumerConfig.name),
            }),
            this.claimConsumer.start({
                next: async (data) => this.onClaimData(data as IClaimTx[]),
                summary: async (data: ILastIndexedTransaction) =>
                    this.onClaimDataSummary(data),
                error: (err: ConsumerError | ExternalDependencyError) =>
                    this.onError(this.claimConsumerConfig.name, err),
                closed: () => this.onClosed(this.claimConsumerConfig.name),
            }),
            this.mappingConsumer.start({
                next: async (data) => this.onMappingData(data as IMappingTx[]),
                summary: async (data: ILastIndexedTransaction) =>
                    this.onMappingDataSummary(data),
                error: (err: ConsumerError | ExternalDependencyError) =>
                    this.onError(this.mappingConsumerConfig.name, err),
                closed: () => this.onClosed(this.mappingConsumerConfig.name),
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

    private async onBridgeData(data: IBridgeTx[]): Promise<void> {
        try {
            const mappedTransactions =
                this.transactionMapper.mapBridgeTransactions(data);
            await this.transactionService.saveBridges(mappedTransactions);
        } catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            Logger.error({
                location: "bridge_api_consumer",
                function: "onBridgeData",
                status: `ERROR encountered on bridge consumer`,
                error: error,
            });
            throw new ConsumerError(
                `Error in onBridgeData : ${(error as Error).message}`,
                {
                    isFatal: true,
                    code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
                    context: {
                        error: error as Error,
                    },
                }
            );
        }
    }
    private async onClaimData(data: IClaimTx[]): Promise<void> {
        try {
            const mappedTransactions =
                this.transactionMapper.mapClaimTransactions(data);
            await this.transactionService.saveClaims(mappedTransactions);
        } catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            Logger.error({
                location: "bridge_api_consumer",
                function: "onClaimData",
                status: `ERROR encountered on claim consumer`,
                error: error,
            });
            throw new ConsumerError(
                `Error in onClaimData : ${(error as Error).message}`,
                {
                    isFatal: true,
                    code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
                    context: {
                        error: error as Error,
                    },
                }
            );
        }
    }
    private async onMappingData(data: IMappingTx[]): Promise<void> {
        try {
            const mappedTransactions =
                this.tokenMappingsMapper.mapMappings(data);
            await this.tokenMappingsService.saveTokenMappings(
                mappedTransactions
            );
        } catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            Logger.error({
                location: "bridge_api_consumer",
                function: "onMappingData",
                status: `ERROR encountered on mapping consumer`,
                error: error,
            });
            throw new ConsumerError(
                `Error in onMappingData : ${(error as Error).message}`,
                {
                    isFatal: true,
                    code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
                    context: {
                        error: error as Error,
                    },
                }
            );
        }
    }

    private async onBridgeDataSummary(
        data: ILastIndexedTransaction
    ): Promise<void> {
        try {
            const mappedMetadata =
                this.metadataMapper.mapLastIndexedBridgeTx(data);
            await this.metadataService.saveLastIndexedTxs(mappedMetadata);
        } catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            Logger.error({
                location: "bridge_api_consumer",
                function: "onBridgeDataSummary",
                status: `ERROR encountered on mapping consumer`,
                error: error,
            });
            throw new ConsumerError(
                `Error in onMappingData : ${(error as Error).message}`,
                {
                    isFatal: true,
                    code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
                    context: {
                        error: error as Error,
                    },
                }
            );
        }
    }

    private async onClaimDataSummary(
        data: ILastIndexedTransaction
    ): Promise<void> {
        try {
            const mappedMetadata =
                this.metadataMapper.mapLastIndexedClaimTx(data);
            await this.metadataService.saveLastIndexedTxs(mappedMetadata);
        } catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            Logger.error({
                location: "bridge_api_consumer",
                function: "onClaimDataSummary",
                status: `ERROR encountered on mapping consumer`,
                error: error,
            });
            throw new ConsumerError(
                `Error in onMappingData : ${(error as Error).message}`,
                {
                    isFatal: true,
                    code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
                    context: {
                        error: error as Error,
                    },
                }
            );
        }
    }

    private async onMappingDataSummary(
        data: ILastIndexedTransaction
    ): Promise<void> {
        try {
            const mappedMetadata =
                this.metadataMapper.mapLastIndexedMappingTx(data);
            await this.metadataService.saveLastIndexedTxs(mappedMetadata);
        } catch (error) {
            if (error instanceof DatabaseError) {
                throw error;
            }
            Logger.error({
                location: "bridge_api_consumer",
                function: "onMappingDataSummary",
                status: `ERROR encountered on mapping consumer`,
                error: error,
            });
            throw new ConsumerError(
                `Error in onMappingData : ${(error as Error).message}`,
                {
                    isFatal: true,
                    code: errorCodes.consumer.UNKNOWN_CONSUMER_ERR,
                    context: {
                        error: error as Error,
                    },
                }
            );
        }
    }

    private onError(
        consumerName: string,
        err: ConsumerError | ExternalDependencyError | Error
    ): void {
        Logger.error({
            location: "bridge_api_consumer",
            status: `ERROR encountered on ${consumerName} consumer`,
            error: err,
        });
    }

    private onClosed(consumerName: string): void {
        console.warn(`${consumerName} consumer has closed.`);
    }
}
