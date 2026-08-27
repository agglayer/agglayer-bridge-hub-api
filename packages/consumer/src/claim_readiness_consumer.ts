import { Cron } from 'croner';

import { ApiError, Logger } from '@polygonlabs/servercore';

import type { IClaimReadinessConfig } from './interfaces/claim_readiness_config.ts';
import type { TransactionsService } from './services/transaction.ts';

/**
 * Per-request timeout for the AggKit HTTP calls. `fetch` has no default timeout,
 * so a single unresponsive AggKit request hangs forever. Because the cron runs
 * with overrun protection (`protect: true`), one hung request silently blocks
 * every subsequent tick — the consumer keeps "running" but never promotes
 * another transaction. A bounded timeout aborts the request so it's caught and
 * logged below and the transaction is simply retried on the next tick.
 */
const AGGKIT_FETCH_TIMEOUT_MS = 10_000;

export class ClaimReadinessConsumer {
	private config: IClaimReadinessConfig;
	private transactionService: TransactionsService;
	private cronJob: Cron | null = null;

	constructor(config: IClaimReadinessConfig, transactionService: TransactionsService) {
		this.config = config;
		this.transactionService = transactionService;
	}

	public async start(): Promise<void> {
		if (this.config.cronExpr) {
			// Cron's `protect: true` blocks new triggers while a previous run
			// is still in progress. Without a `catch` handler, an unhandled
			// rejection from the triggered function makes croner exit
			// _trigger() before it clears that in-progress flag — protect's
			// overrun guard then wedges shut for the rest of the process's
			// life, since every future scheduled run is skipped forever
			// (verified against croner's source; this is exactly how the
			// 2026-08-25 MongoDB blip permanently killed this cron via
			// @polygonlabs/servercore's AbstractCronEventConsumer, which
			// never passed a `catch` option). Passing `catch` here is what
			// makes protect self-healing instead of a one-way latch.
			this.cronJob = new Cron(
				this.config.cronExpr,
				{
					protect: true,
					catch: (error) => {
						Logger.error({
							location: 'ClaimReadinessConsumer',
							function: 'onTick',
							networkId: this.config.networkId,
							message: `NetId ${this.config.networkId} Claim readiness tick failed`,
							error: error instanceof Error ? error.message : String(error)
						});
					}
				},
				async () => {
					await this.onTick();
				}
			);
		} else {
			// fallback: run once if no cron
			await this.onTick();
		}
	}

	public stop(): void {
		this.cronJob?.stop();
		this.cronJob = null;
	}

	protected async onTick(): Promise<void> {
		Logger.info({
			location: 'ClaimReadinessConsumer',
			function: 'onTick',
			message: `NetId ${this.config.networkId} Claim readiness check triggered`
		});
		await this.syncL1InfoTree();
		await this.syncInjectedL1InfoTree();
	}

	private async syncL1InfoTree(): Promise<void> {
		let hasNext = true;
		let afterId = undefined;
		let scanned = 0;
		let promoted = 0;
		let failed = 0;

		while (hasNext) {
			const bridgedTransactions = await this.transactionService.getBridgedTransactions(
				this.config.networkId,
				afterId
			);
			if (bridgedTransactions.length === 0) {
				Logger.debug({
					location: 'ClaimReadinessConsumer',
					function: 'syncL1InfoTree',
					networkId: this.config.networkId,
					message: `NetId ${this.config.networkId} No bridged transactions found`
				});
				hasNext = false;
			}

			for (const tx of bridgedTransactions) {
				scanned++;
				try {
					Logger.debug({
						location: 'ClaimReadinessConsumer',
						function: 'syncL1InfoTree',
						networkId: this.config.networkId,
						message: `NetId ${this.config.networkId} Processing transaction ${tx.depositCount} on network ${tx.sourceNetwork}`
					});

					afterId = tx.hubUID;

					const leafResponse = await fetch(
						`${this.config.l1InfoTreeIndexUrl}?network_id=${this.config.networkId}&deposit_count=${tx.depositCount}`,
						{ signal: AbortSignal.timeout(AGGKIT_FETCH_TIMEOUT_MS) }
					);
					if (!leafResponse.ok) {
						throw new ApiError(
							`Failed to fetch leaf index for transaction ${tx.depositCount} on network ${tx.sourceNetwork}`,
							{
								isFatal: false,
								context: {
									location: 'ClaimReadinessConsumer',
									function: 'syncL1InfoTree',
									url: `${this.config.l1InfoTreeIndexUrl}?network_id=${this.config.networkId}&deposit_count=${tx.depositCount}`
								}
							}
						);
					}
					const leafIndex = await leafResponse.json();
					await this.transactionService.updateLeafIndex(
						tx.depositCount,
						tx.sourceNetwork,
						leafIndex
					);
					promoted++;
				} catch (error) {
					failed++;
					// A missing leaf index is expected steady-state — the deposit
					// may not yet be included in the L1 info tree, and the tx is
					// retried next tick. Logged at debug so a large not-yet-ready
					// backlog doesn't flood the logs every tick; the per-tick
					// summary below carries the counts.
					Logger.debug({
						location: 'ClaimReadinessConsumer',
						function: 'syncL1InfoTree',
						networkId: this.config.networkId,
						message: `NetId ${this.config.networkId} Error processing transaction ${tx.depositCount} on source network ${tx.sourceNetwork}`,
						error: error instanceof Error ? error.message : String(error)
					});
				}
			}
		}

		Logger.info({
			location: 'ClaimReadinessConsumer',
			function: 'syncL1InfoTree',
			networkId: this.config.networkId,
			message: `NetId ${this.config.networkId} L1 info tree sync complete`,
			scanned,
			promoted,
			failed
		});
	}

	private async syncInjectedL1InfoTree(): Promise<void> {
		let hasNext = true;
		let afterId = undefined;
		let scanned = 0;
		let promoted = 0;
		let failed = 0;

		while (hasNext) {
			const leafIncludedTransactions = await this.transactionService.getLeafIncludedTransactions(
				this.config.networkId,
				afterId
			);
			if (leafIncludedTransactions.length === 0) {
				Logger.debug({
					location: 'ClaimReadinessConsumer',
					function: 'syncInjectedL1InfoTree',
					networkId: this.config.networkId,
					message: `NetId ${this.config.networkId} No leaf included transactions found`
				});
				hasNext = false;
			}

			for (const tx of leafIncludedTransactions) {
				scanned++;
				Logger.debug({
					location: 'ClaimReadinessConsumer',
					function: 'syncInjectedL1InfoTree',
					networkId: this.config.networkId,
					message: `NetId ${this.config.networkId} Processing transaction ${tx.depositCount} from network ${tx.sourceNetwork} with leaf index ${tx.leafIndex}`
				});
				try {
					afterId = tx.hubUID;
					const injectedTreeResponse = await fetch(
						`${this.config.injectedL1InfoLeafUrl}?network_id=${this.config.networkId}&leaf_index=${tx.leafIndex}`,
						{ signal: AbortSignal.timeout(AGGKIT_FETCH_TIMEOUT_MS) }
					);

					if (!injectedTreeResponse.ok) {
						throw new ApiError(
							`Failed to fetch injected tree for transaction ${tx.depositCount} of source network ${tx.sourceNetwork}`,
							{
								isFatal: false,
								context: {
									location: 'ClaimReadinessConsumer',
									function: 'syncInjectedL1InfoTree',
									url: `${this.config.injectedL1InfoLeafUrl}?network_id=${this.config.networkId}&leaf_index=${tx.leafIndex}`
								}
							}
						);
					}

					const injectedTreeData = await injectedTreeResponse.json();

					if (injectedTreeData?.global_exit_root) {
						await this.transactionService.updateTransactionToReadyToClaim(
							tx.depositCount,
							tx.sourceNetwork,
							injectedTreeData.l1_info_tree_index
						);
						promoted++;
					}
				} catch (error) {
					failed++;
					// A missing injected tree is expected steady-state — the leaf
					// may not yet be injected into the L1 info tree, and the tx is
					// retried next tick. Logged at debug so the not-yet-ready
					// backlog doesn't flood the logs every tick; the per-tick
					// summary below carries the counts.
					Logger.debug({
						location: 'ClaimReadinessConsumer',
						function: 'syncInjectedL1InfoTree',
						networkId: this.config.networkId,
						message: `NetId ${this.config.networkId} Error processing transaction ${tx.depositCount} on network ${tx.sourceNetwork} with leaf index ${tx.leafIndex}`,
						error: error instanceof Error ? error.message : String(error)
					});
				}
			}
		}

		Logger.info({
			location: 'ClaimReadinessConsumer',
			function: 'syncInjectedL1InfoTree',
			networkId: this.config.networkId,
			message: `NetId ${this.config.networkId} Injected L1 info tree sync complete`,
			scanned,
			promoted,
			failed
		});
	}
}
