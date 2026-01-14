import { ethers } from "ethers";
import { decodeParameters } from "web3-eth-abi";
import {
	IProof,
	IHubTransaction,
	ClaimProofResponse,
	ITransactionResponse,
} from "../schemas/index.js";

import { Logger } from "@polygonlabs/servercore";

const _GLOBAL_INDEX_MAINNET_FLAG = BigInt(2 ** 64);

export default class TransactionService {
	constructor(
		private bridgeHubAPIUrl: string,
		private sourceNetworks: string,
		private destinationNetwork: string,
		private ethersClients: { [key: string]: ethers.JsonRpcProvider }
	) {}

	async getPendingTransactions(): Promise<IHubTransaction[]> {
		let transactions: IHubTransaction[] = [];
		let startAfter = undefined;
		let hasNext = true;
		let sourceNetworkIds = "";
		JSON.parse(this.sourceNetworks).forEach((networkId: number) => {
			sourceNetworkIds = `${sourceNetworkIds}${networkId},`;
		});
		sourceNetworkIds = sourceNetworkIds.slice(0, -1);

		try {
			while (hasNext) {
				const response = await fetch(
					`${this.bridgeHubAPIUrl}/transactions?destinationNetworkIds=${this.destinationNetwork}&sourceNetworkIds=${sourceNetworkIds}&status=READY_TO_CLAIM&limit=50&startAfter=${startAfter}`
				);

				const transactionData: ITransactionResponse =
					await response.json();

				if (transactionData && transactionData.data) {
					transactions = [...transactions, ...transactionData.data];
					transactions = transactions.filter(
						(obj) =>
							!(obj.leafType === "MESSAGE" && obj.amount === "0")
					);

					startAfter =
						transactionData.pagination.nextStartAfterCursor;
					if (!startAfter) {
						hasNext = false;
					}
				}
			}
		} catch (error: any) {
			Logger.error({
				location: "TransactionService.getPendingTransactions",
				error: error.message,
			});
		}

		Logger.info({
			location: "TransactionService.getPendingTransactions",
			length: transactions.length,
		});
		return transactions;
	}

	async getProof(
		sourceNetwork: number,
		depositCount: number,
		leafIndex: number
	): Promise<IProof | null> {
		let proof: IProof | null = null;
		try {
			const response = await fetch(
				`${this.bridgeHubAPIUrl}/claim-proof?sourceNetworkId=${sourceNetwork}&leafIndex=${leafIndex}&depositCount=${depositCount}`
			);
			const proofData: ClaimProofResponse = await response.json();
			if (
				proofData?.data?.proof_local_exit_root &&
				proofData?.data?.proof_rollup_exit_root
			) {
				proof = proofData.data;
			}
		} catch (error: any) {
			Logger.error({
				location: "TransactionService.getProof",
				error: error.message,
				data: {
					sourceNetwork,
					depositCount,
					endpoint: `/claim-proof?sourceNetworkId=${sourceNetwork}&leafIndex=${leafIndex}&depositCount=${depositCount}`,
				},
			});
		}
		return proof;
	}

	computeGlobalIndex(indexLocal: number, sourceNetworkId: number): bigint {
		if (BigInt(sourceNetworkId) === BigInt(0)) {
			return BigInt(indexLocal) + _GLOBAL_INDEX_MAINNET_FLAG;
		} else {
			return (
				BigInt(indexLocal) +
				BigInt(sourceNetworkId - 1) * BigInt(2 ** 32)
			);
		}
	}

	async getTransactionPayload(
		transactionHash: string,
		sourceNetwork: number,
		counter: number
	) {
		const transaction =
			await this.ethersClients[sourceNetwork].getTransactionReceipt(
				transactionHash
			);
		if (transaction) {
			let logs = transaction.logs.filter(
				(obj) =>
					obj.topics[0].toLowerCase() ===
					"0x501781209a1f8899323b96b4ef08b168df93e0a90c673d1e4cce39366cb62f9b".toLowerCase()
			);
			logs = logs.filter(
				(obj) =>
					decodeParameters(
						[
							"uint8",
							"uint32",
							"address",
							"uint32",
							"address",
							"uint256",
							"bytes",
							"uint32",
						],
						obj.data
					)[7] === BigInt(counter)
			);
			if (logs.length) {
				const data = decodeParameters(
					[
						"uint8",
						"uint32",
						"address",
						"uint32",
						"address",
						"uint256",
						"bytes",
						"uint32",
					],
					logs[0].data
				);
				return {
					globalIndex: this.computeGlobalIndex(
						data[7] as number,
						sourceNetwork
					).toString(),
					originNetwork: data[1],
					originTokenAddress: data[2],
					destinationNetwork: data[3],
					destinationAddress: data[4],
					amount: data[5],
					metadata: data[6] || "0x",
				};
			}
		}
		return null;
	}
}
