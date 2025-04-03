import { ConsumerError } from "../errors/consumer_errors";
import { EventConsumer } from "./abstract_event_consumer";
import { JSONRPCClient } from "../helpers/json_rpc_client";
import type { IConsumerConfig } from "../interfaces/consumer_config";
import type { IObserver } from "../interfaces/observer";
import { Cron } from "croner";
import type { IBridgeTx } from "../interfaces/bridge_tx";
import type { IClaimTx } from "../interfaces/claim_tx";
import type { IMappingTx } from "../interfaces/token_mapping";
import type { IBridgesBridgeAPIResult } from "../../dist/interfaces/bridge_tx";
import type { IClaimsBridgeAPIResult } from "../../dist/interfaces/claim_tx";
import type { IMappingsBridgeAPIResult } from "../../dist/interfaces/token_mapping";
import { ExternalDependencyError } from "../../dist/errors/external_dependency_error";
import { errorCodes } from "../errors/error_codes";

export class JsonRpcConsumer<
    T extends
        | IBridgesBridgeAPIResult
        | IClaimsBridgeAPIResult
        | IMappingsBridgeAPIResult,
    E extends IBridgeTx | IClaimTx | IMappingTx
> extends EventConsumer {
    private consumerRunning: boolean = false;
    protected observer: IObserver<object, ConsumerError> | null = null;
    private cronjob: Cron | null = null;
    private lastConsumedBlock: number = 0;

    constructor(
        private jsonRpcClient: JSONRPCClient,
        private config: IConsumerConfig,
        private getTransactionsFromResult: Function,
        private lastIndexedTranasctionHash: string | null
    ) {
        super();
    }

    private async request<T>(params?: any[]): Promise<T | undefined> {
        try {
            return await this.jsonRpcClient.call({
                method: this.config.requestMethod,
                params,
            });
        } catch (error) {
            this.onFatalError(error as ConsumerError);
            throw error;
        }
    }

    public async start(
        observer: IObserver<object, ConsumerError>
    ): Promise<void> {
        if (
            this.listenerCount("event.error") ||
            this.listenerCount("data") ||
            this.listenerCount("disconnected")
        ) {
            this.removeAllListeners();
        }

        this.lastConsumedBlock = this.config.startBlock;
        this.observer = observer;
        this.consumerRunning = true;

        this.cronjob = new Cron(
            `* * * * * *`,
            { protect: true, interval: this.config.pollInterval },
            async () => {
                try {
                    let earliestProcessedBlockInThisRun = 0;
                    let latestProcessedBlockInThisRun = 0;
                    let pageNumber = 1;
                    let continueRun = true;

                    while (
                        continueRun &&
                        (earliestProcessedBlockInThisRun >=
                            this.lastConsumedBlock ||
                            this.lastConsumedBlock === 0 ||
                            earliestProcessedBlockInThisRun === 0)
                    ) {
                        let newTransactions: E[] = [];
                        const result = await this.request<T>([
                            this.config.networkId,
                            pageNumber,
                            this.config.pollSize,
                        ]);
                        if (result) {
                            if (result.count === 0) {
                                this.lastConsumedBlock = Math.max(
                                    this.lastConsumedBlock,
                                    latestProcessedBlockInThisRun
                                );
                                break;
                            }

                            const processedTransactions =
                                this.getTransactionsFromResult(result);

                            for (const tx of processedTransactions) {
                                if (
                                    tx.block_num >= this.lastConsumedBlock &&
                                    tx.tx_hash !==
                                        this.lastIndexedTranasctionHash
                                ) {
                                    newTransactions.push(tx);
                                    earliestProcessedBlockInThisRun =
                                        earliestProcessedBlockInThisRun > 0
                                            ? Math.min(
                                                  tx.block_num,
                                                  earliestProcessedBlockInThisRun
                                              )
                                            : tx.block_num;
                                    latestProcessedBlockInThisRun = Math.max(
                                        tx.block_num,
                                        latestProcessedBlockInThisRun
                                    );
                                } else {
                                    this.lastConsumedBlock = Math.max(
                                        this.lastConsumedBlock,
                                        latestProcessedBlockInThisRun
                                    );
                                    continueRun = false;
                                    break;
                                }
                            }
                            if (pageNumber === 1) {
                                this.lastIndexedTranasctionHash =
                                    processedTransactions[0].tx_hash;
                            }
                            console.log(
                                `${this.config.name} consumer - Page ${pageNumber} processed. ${processedTransactions.length} transactions found.`
                            );
                            pageNumber++;
                        } else {
                            observer.error(
                                new ConsumerError(
                                    "Invalid response: Expected an object",
                                    { isFatal: false }
                                )
                            );
                        }

                        if (newTransactions.length > 0) {
                            await observer.next(newTransactions);
                        }
                    }
                } catch (error) {
                    if (error instanceof ExternalDependencyError) {
                        observer.error(error);
                    }
                    observer.error(
                        new ConsumerError((error as Error).message, {
                            origin: "JsonRpcConsumer",
                            context: {
                                error: error,
                            },
                        })
                    );
                }
            }
        );
    }

    /**
     * Private method which updates the connection status of consumer to disconnected, and removes all listeners.
     *
     * @returns {void}
     */
    private onDisconnect(): void {
        if (this.cronjob ? this.cronjob.isRunning() : false) {
            this.cronjob?.stop();
            this.observer?.closed();
            this.removeAllListeners();
        }
    }
}
