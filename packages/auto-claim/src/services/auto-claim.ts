import { Logger } from "@polygonlabs/servercore";
import TransactionService from "./transaction";
import type { ClaimProof, IHubTransaction } from "@agglayer/bridge-hub-commons";
import {
	getContract,
	type GetContractReturnType,
	type WalletClient,
} from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { BRIDGE_ABI } from "../constants/bridge";

/**
 * Service for automatically claiming ready bridge transactions.
 *
 * Polls the Bridge Hub API for READY_TO_CLAIM transactions, fetches proofs,
 * and submits claim transactions to the destination blockchain.
 *
 * @class AutoClaimService
 */
export default class AutoClaimService {
	/**
	 * Creates an instance of AutoClaimService.
	 *
	 * @param {`0x${string}`} bridgeContractAddress - The bridge contract address on the destination chain
	 * @param {WalletClient} walletClient - Viem wallet client for signing and sending transactions
	 * @param {TransactionService} transactionService - Service for fetching transactions and proofs from Bridge Hub API
	 */
	private readonly bridgeContract: GetContractReturnType<
		typeof BRIDGE_ABI,
		WalletClient
	>;
	private readonly transactionService: TransactionService;
	private readonly walletClient: WalletClient;

	constructor(
		bridgeContractAddress: `0x${string}`,
		walletClient: WalletClient,
		transactionService: TransactionService
	) {
		this.bridgeContract = getContract({
			address: bridgeContractAddress,
			abi: BRIDGE_ABI,
			client: walletClient,
		});
		this.transactionService = transactionService;
		this.walletClient = walletClient;
	}

	private async sendTransaction(
		transaction: IHubTransaction,
		proof: ClaimProof,
		globalIndex: bigint
	): Promise<string | false> {
		const bridgeDetails = {
			transactionHash: transaction.transactionHash,
			sourceNetwork: transaction.sourceNetwork,
			depositCount: transaction.depositCount,
		};

		try {
			Logger.info({
				location: "AutoClaimService.sendTransaction.start",
				bridgeDetails,
			});

			let txHash = null;

			if (transaction.leafType === "ASSET") {
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
				location: "AutoClaimService.sendTransaction.submitted",
				message: `claim hash: ${txHash}`,
			});

			// Wait for transaction confirmation
			const receipt = await waitForTransactionReceipt(this.walletClient, {
				hash: txHash,
			});

			Logger.info({
				location: "AutoClaimService.sendTransaction.completed",
				message: `claim confirmed: ${txHash}, status: ${receipt.status}`,
			});
			return txHash;
		} catch (error: any) {
			Logger.error({
				location: "AutoClaimService.sendTransaction.error",
				error: error,
				data: bridgeDetails,
			});

			return false;
		}
	}

	async claimTransactions() {
		try {
			Logger.info({
				location: "AutoClaimService.claimTransactions",
				call: "started",
			});
			const transactions: IHubTransaction[] =
				await this.transactionService.getPendingTransactions();

			for (const transaction of transactions) {
				if (!transaction.leafIndexForProof) {
					continue;
				}
				const proof = await this.transactionService.getProof(
					transaction.sourceNetwork,
					transaction.depositCount,
					transaction.leafIndexForProof
				);
				const globalIndex = transaction.globalIndex
					? BigInt(transaction.globalIndex)
					: this.transactionService.computeGlobalIndex(
							transaction.depositCount,
							transaction.sourceNetwork
						);
				if (proof) {
					await this.sendTransaction(transaction, proof, globalIndex);
				}
			}

			Logger.info({
				location: "AutoClaimService.claimTransactions",
				call: "completed",
			});
			return;
		} catch (error: any) {
			Logger.error({
				location: "AutoClaimService.claimTransactions",
				error: error.message ? error.message : error,
			});
			throw error;
		}
	}
}
