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
		await this.syncL1InfoTree();
		await this.syncInjectedL1InfoTree();
	}

	private async syncL1InfoTree(): Promise<void> {
		let hasNext = true;
		let afterId = undefined;

		while (hasNext) {
			const bridgedTransactions =
				await this.transactionService.getBridgedTransactions(
					this.config.networkId,
					afterId
				);
			if (bridgedTransactions.length === 0) {
				Logger.info({
					location: "ClaimReadinessConsumer",
					function: "syncL1InfoTree",
					networkId: this.config.networkId,
					message: `NetId ${this.config.networkId} No bridged transactions found`,
				});
				hasNext = false;
			}

			for (const tx of bridgedTransactions) {
				try {
					Logger.info({
						location: "ClaimReadinessConsumer",
						function: "syncL1InfoTree",
						networkId: this.config.networkId,
						message: `NetId ${this.config.networkId}Processing transaction ${tx.depositCount} on network ${tx.sourceNetwork}`,
					});

					afterId = tx.hubUID;

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
									function: "syncL1InfoTree",
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
					Logger.info({
						location: "ClaimReadinessConsumer",
						function: "syncL1InfoTree",
						networkId: this.config.networkId,
						message: `NetId ${this.config.networkId}Error processing transaction ${tx.depositCount} on source network ${tx.sourceNetwork}`,
						error:
							error instanceof Error
								? error.message
								: String(error),
					});
				}
			}
		}
	}

	private async syncInjectedL1InfoTree(): Promise<void> {
		let hasNext = true;
		let afterId = undefined;

		while (hasNext) {
			const leafIncludedTransactions =
				await this.transactionService.getLeafIncludedTransactions(
					this.config.networkId,
					afterId
				);
			if (leafIncludedTransactions.length === 0) {
				Logger.info({
					location: "ClaimReadinessConsumer",
					function: "syncInjectedL1InfoTree",
					networkId: this.config.networkId,
					message: `NetId ${this.config.networkId} No leaf included transactions found`,
				});
				hasNext = false;
			}

			for (const tx of leafIncludedTransactions) {
				Logger.info({
					location: "ClaimReadinessConsumer",
					function: "syncInjectedL1InfoTree",
					networkId: this.config.networkId,
					message: `NetId ${this.config.networkId}Processing transaction ${tx.depositCount} from network ${tx.sourceNetwork} with leaf index ${tx.leafIndex}`,
				});
				try {
					afterId = tx.hubUID;
					const injectedTreeResponse = await fetch(
						`${this.config.injectedL1InfoLeafUrl}?network_id=${this.config.networkId}&leaf_index=${tx.leafIndex}`
					);

					if (!injectedTreeResponse.ok) {
						throw new ApiError(
							`Failed to fetch injected tree for transaction ${tx.depositCount} of source network ${tx.sourceNetwork}`,
							{
								isFatal: false,
								context: {
									location: "ClaimReadinessConsumer",
									function: "syncInjectedL1InfoTree",
									url: `${this.config.injectedL1InfoLeafUrl}?network_id=${this.config.networkId}&leaf_index=${tx.leafIndex}`,
								},
							}
						);
					}

					const injectedTreeData = await injectedTreeResponse.json();

					if (injectedTreeData?.global_exit_root) {
						await this.transactionService.updateTransactionToReadyToClaim(
							tx.depositCount,
							tx.sourceNetwork
						);
					}
				} catch (error) {
					Logger.info({
						location: "ClaimReadinessConsumer",
						function: "syncInjectedL1InfoTree",
						networkId: this.config.networkId,
						message: `NetId ${this.config.networkId}Error processing transaction ${tx.depositCount} on network ${tx.sourceNetwork} with leaf index ${tx.leafIndex}`,
						error:
							error instanceof Error
								? error.message
								: String(error),
					});
				}
			}
		}
	}
}
