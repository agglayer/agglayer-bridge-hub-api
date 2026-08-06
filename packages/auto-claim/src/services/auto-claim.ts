import type { GetContractReturnType, WalletClient } from 'viem';

import { getContract } from 'viem';
import { waitForTransactionReceipt } from 'viem/actions';

import type { ClaimProof, IHubTransaction } from '@agglayer/bridge-hub-types';

import { Logger } from '@polygonlabs/servercore';

import type { ClaimCircuitBreakerOptions } from './circuit-breaker.ts';
import type { TransactionService } from './transaction.ts';

import { BRIDGE_ABI } from '../constants/bridge.ts';
import { ClaimCircuitBreaker } from './circuit-breaker.ts';

/**
 * Service for automatically claiming ready bridge transactions.
 *
 * Polls the Bridge Hub API for READY_TO_CLAIM transactions, fetches proofs,
 * and submits claim transactions to the destination blockchain.
 *
 * @class AutoClaimService
 */
export class AutoClaimService {
	/**
	 * Creates an instance of AutoClaimService.
	 *
	 * @param {`0x${string}`} bridgeContractAddress - The bridge contract address on the destination chain
	 * @param {WalletClient} walletClient - Viem wallet client for signing and sending transactions
	 * @param {TransactionService} transactionService - Service for fetching transactions and proofs from Bridge Hub API
	 */
	private readonly bridgeContract: GetContractReturnType<typeof BRIDGE_ABI, WalletClient>;
	private readonly transactionService: TransactionService;
	private readonly walletClient: WalletClient;
	private readonly circuitBreaker: ClaimCircuitBreaker;

	constructor(
		bridgeContractAddress: `0x${string}`,
		walletClient: WalletClient,
		transactionService: TransactionService,
		circuitBreakerOptions?: ClaimCircuitBreakerOptions
	) {
		this.bridgeContract = getContract({
			address: bridgeContractAddress,
			abi: BRIDGE_ABI,
			client: walletClient
		});
		this.transactionService = transactionService;
		this.walletClient = walletClient;
		this.circuitBreaker = new ClaimCircuitBreaker(circuitBreakerOptions);
	}

	private async sendTransaction(
		transaction: IHubTransaction,
		proof: ClaimProof,
		globalIndex: bigint
	): Promise<string | false> {
		const bridgeDetails = {
			transactionHash: transaction.transactionHash,
			sourceNetwork: transaction.sourceNetwork,
			depositCount: transaction.depositCount
		};

		try {
			Logger.info({
				location: 'AutoClaimService.sendTransaction.start',
				message: `submitting claim for sourceNetwork=${bridgeDetails.sourceNetwork} depositCount=${bridgeDetails.depositCount}`,
				bridgeDetails
			});

			let txHash = null;

			if (transaction.leafType === 'ASSET') {
				txHash = await this.bridgeContract.write.claimAsset(
					proof.proof_local_exit_root,
					proof.proof_rollup_exit_root,
					globalIndex,
					proof.l1_info_tree_leaf.mainnet_exit_root,
					proof.l1_info_tree_leaf.rollup_exit_root,
					transaction.originTokenNetwork,
					transaction.originTokenAddress,
					transaction.destinationNetwork,
					transaction.receiverAddress,
					BigInt(transaction.amount),
					proof.bridge_tx_metadata
				);
			} else {
				txHash = await this.bridgeContract.write.claimMessage(
					proof.proof_local_exit_root,
					proof.proof_rollup_exit_root,
					globalIndex,
					proof.l1_info_tree_leaf.mainnet_exit_root,
					proof.l1_info_tree_leaf.rollup_exit_root,
					transaction.originTokenNetwork,
					transaction.originTokenAddress,
					transaction.destinationNetwork,
					transaction.receiverAddress,
					BigInt(transaction.amount),
					proof.bridge_tx_metadata
				);
			}

			Logger.info({
				location: 'AutoClaimService.sendTransaction.submitted',
				message: `claim hash: ${txHash}`
			});

			// Wait for transaction confirmation
			const receipt = await waitForTransactionReceipt(this.walletClient, {
				hash: txHash
			});

			Logger.info({
				location: 'AutoClaimService.sendTransaction.completed',
				message: `claim confirmed: ${txHash}, status: ${receipt.status}`
			});
			return txHash;
		} catch (error: any) {
			Logger.error({
				location: 'AutoClaimService.sendTransaction.error',
				message: `claim submission failed for sourceNetwork=${bridgeDetails.sourceNetwork} depositCount=${bridgeDetails.depositCount}`,
				error: error,
				data: bridgeDetails
			});

			return false;
		}
	}

	/**
	 * Logs (once, on the trip transition) and records that a transaction has permanently
	 * failed its claim-proof lookup or claim submission, per {@link ClaimCircuitBreaker}.
	 */
	private recordClaimFailure(sourceNetwork: number, depositCount: number, breakerKey: string) {
		const justTripped = this.circuitBreaker.recordFailure(breakerKey);
		if (justTripped) {
			Logger.warn({
				location: 'AutoClaimService.claimTransactions.circuitBreakerTripped',
				message: `circuit breaker tripped for sourceNetwork=${sourceNetwork} depositCount=${depositCount} — skipping on future ticks after repeated claim-proof/claim failures`,
				sourceNetwork,
				depositCount
			});
		}
	}

	async claimTransactions() {
		try {
			Logger.info({
				location: 'AutoClaimService.claimTransactions',
				message: 'claim tick started',
				call: 'started'
			});
			const transactions: IHubTransaction[] =
				await this.transactionService.getPendingTransactions();

			for (const transaction of transactions) {
				if (!transaction.leafIndexForProof) {
					continue;
				}

				const breakerKey = ClaimCircuitBreaker.keyFor(
					transaction.sourceNetwork,
					transaction.depositCount
				);
				if (this.circuitBreaker.shouldSkip(breakerKey)) {
					continue;
				}

				const proof = await this.transactionService.getProof(
					transaction.sourceNetwork,
					transaction.depositCount,
					transaction.leafIndexForProof
				);
				if (!proof) {
					this.recordClaimFailure(transaction.sourceNetwork, transaction.depositCount, breakerKey);
					continue;
				}

				const globalIndex = transaction.globalIndex
					? BigInt(transaction.globalIndex)
					: this.transactionService.computeGlobalIndex(
							transaction.depositCount,
							transaction.sourceNetwork
						);
				const txHash = await this.sendTransaction(transaction, proof, globalIndex);
				if (txHash) {
					this.circuitBreaker.recordSuccess(breakerKey);
				} else {
					this.recordClaimFailure(transaction.sourceNetwork, transaction.depositCount, breakerKey);
				}
			}

			Logger.info({
				location: 'AutoClaimService.claimTransactions',
				message: 'claim tick completed',
				call: 'completed'
			});
			return;
		} catch (error: any) {
			Logger.error({
				location: 'AutoClaimService.claimTransactions',
				message: `claim tick failed: ${error.message ? error.message : error}`,
				error: error.message ? error.message : error
			});
			throw error;
		}
	}
}
