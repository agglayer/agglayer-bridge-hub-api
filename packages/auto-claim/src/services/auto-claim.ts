import { Logger } from "@polygonlabs/servercore";
import { IHubTransaction } from "../schemas/index.js";
import { ethers } from "ethers";
import { IProof } from "../schemas/index.js";
import TransactionService from "./transaction.js";

/**
 * AutoClaimService service class is a class which has function to autoclaim transactions
 *
 * @class AutoClaimService
 */
export default class AutoClaimService {
	/**
	 * @constructor
	 *
	 * @param {ethers.Contract} bridgeContract
	 * @param {TransactionService} transactionService
	 * @param {string} destinationNetwork
	 */
	constructor(
		private bridgeContract: ethers.Contract,
		private transactionService: TransactionService
	) {}

	private async sendTransaction(
		transaction: IHubTransaction,
		proof: IProof,
		globalIndex: bigint
	): Promise<boolean | ethers.TransactionResponse> {
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

			const transactionPayload =
				await this.transactionService.getTransactionPayload(
					transaction.transactionHash as string,
					transaction.sourceNetwork,
					transaction.depositCount
				);

			if (!transactionPayload) {
				Logger.info({
					location: "AutoClaimService.sendTransaction.payloadError",
					bridgeDetails,
				});
				return false;
			}

			let tx = null;

			if (transaction.leafType === "ASSET") {
				tx = await this.bridgeContract.claimAsset(
					proof.proof_local_exit_root,
					proof.proof_rollup_exit_root,
					globalIndex.toString(),
					proof.l1_info_tree_leaf.mainnet_exit_root,
					proof.l1_info_tree_leaf.rollup_exit_root,
					transactionPayload.originNetwork,
					transactionPayload.originTokenAddress,
					transactionPayload.destinationNetwork,
					transactionPayload.destinationAddress,
					transactionPayload.amount,
					transactionPayload.metadata || "0x"
				);
			} else {
				tx = await this.bridgeContract.claimMessage(
					proof.proof_local_exit_root,
					proof.proof_rollup_exit_root,
					transactionPayload.globalIndex.toString(),
					proof.l1_info_tree_leaf.mainnet_exit_root,
					proof.l1_info_tree_leaf.rollup_exit_root,
					transactionPayload.originNetwork,
					transactionPayload.originTokenAddress,
					transactionPayload.destinationNetwork,
					transactionPayload.destinationAddress,
					transactionPayload.amount,
					transactionPayload.metadata
				);
			}

			Logger.info({
				location: "AutoClaimService.sendTransaction.completed",
				message: `claim hash: ${tx.hash}`,
			});
			return tx;
		} catch (error: any) {
			Logger.error({
				location: "AutoClaimService.sendTransaction.error",
				error: error.message,
				bridgeDetails,
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
