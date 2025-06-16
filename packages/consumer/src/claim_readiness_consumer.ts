import {
    AbstractCronEventConsumer,
    ApiError,
    Logger,
} from "@polygonlabs/servercore";
import type { IClaimReadinessConfig } from "./interfaces/claim_readiness_config";
import type TransactionsService from "./services/transaction";

export class ClaimReadinessConsumer extends AbstractCronEventConsumer {
    constructor(
        private config: IClaimReadinessConfig,
        private transactionService: TransactionsService
    ) {
        super();
    }

    public async start(): Promise<void> {
        if (this.config.cronExpr) {
            this.startCron(this.config.cronExpr);
        } else {
            // fallback: run once if no cron
            await this.onTick();
        }
    }

    public stop(): void {
        this.stopCron();
    }

    protected async onTick(): Promise<void> {
        Logger.info({
            location: "ClaimReadinessConsumer",
            function: "onTick",
            message: `NetId ${this.config.networkId} Claim readiness check triggered`,
        });
        let hasNext = true;

        while (hasNext) {
            const bridgedTransactions =
                await this.transactionService.getBridgedTransactions(
                    this.config.networkId
                );
            if (bridgedTransactions.length === 0) {
                Logger.info({
                    location: "ClaimReadinessConsumer",
                    function: "onTick",
                    message: `NetId ${this.config.networkId} No bridged transactions found`,
                });
                hasNext = false;
            }

            for (const tx of bridgedTransactions) {
                try {
                    Logger.info({
                        location: "ClaimReadinessConsumer",
                        function: "onTick",
                        message: `Processing transaction ${tx.depositCount} on network ${tx.sourceNetwork}`,
                    });

                    const leafResponse = await fetch(
                        `${this.config.l1InfoTreeIndexUrl}?network_id=${this.config.networkId}&deposit_count=${tx.depositCount}`
                    );
                    if (!leafResponse.ok) {
                        throw new ApiError(
                            `Failed to fetch leaf index for transaction ${tx.depositCount} on network ${tx.sourceNetwork}`,
                            {
                                isFatal: false,
                                context: {
                                    location: "ClaimReadinessConsumer",
                                    function: "onTick",
                                    url: `${this.config.l1InfoTreeIndexUrl}?network_id=${this.config.networkId}&deposit_count=${tx.depositCount}`,
                                },
                            }
                        );
                    }
                    const leafIndex = await leafResponse.json();
                    await this.transactionService.updateLeafIndex(
                        tx.depositCount,
                        tx.sourceNetwork,
                        leafIndex
                    );
                } catch (error) {
                    Logger.error({
                        location: "ClaimReadinessConsumer",
                        function: "onTick",
                        message: `Error processing transaction ${tx.depositCount} on network ${tx.sourceNetwork}`,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    });
                    throw error;
                }
            }
        }
    }
}
