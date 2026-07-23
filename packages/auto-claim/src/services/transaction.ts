import type {
	ClaimProof,
	ClaimProofResponse,
	IHubTransaction,
	ITransactionResponse
} from '@agglayer/bridge-hub-types';

import { Logger } from '@polygonlabs/servercore';

const _GLOBAL_INDEX_MAINNET_FLAG = BigInt(2 ** 64);

export class TransactionService {
	private readonly bridgeHubAPIUrl: string;
	private readonly sourceNetworks: string;
	private readonly destinationNetwork: string;

	constructor(bridgeHubAPIUrl: string, sourceNetworks: string, destinationNetwork: string) {
		this.bridgeHubAPIUrl = bridgeHubAPIUrl;
		this.sourceNetworks = sourceNetworks;
		this.destinationNetwork = destinationNetwork;
	}

	async getPendingTransactions(): Promise<IHubTransaction[]> {
		let transactions: IHubTransaction[] = [];
		let startAfter = undefined;
		let hasNext = true;
		let sourceNetworkIds = '';

		try {
			JSON.parse(this.sourceNetworks).forEach((networkId: number) => {
				sourceNetworkIds = `${sourceNetworkIds}${networkId},`;
			});
			sourceNetworkIds = sourceNetworkIds.slice(0, -1);

			while (hasNext) {
				const url = `${this.bridgeHubAPIUrl}/transactions?destinationNetworkIds=${this.destinationNetwork}&sourceNetworkIds=${sourceNetworkIds}&status=READY_TO_CLAIM&limit=50${startAfter ? `&startAfter=${startAfter}` : ''}`;
				const response: Response = await fetch(url);

				const transactionData = (await response.json()) as ITransactionResponse;

				if (transactionData && transactionData.data) {
					transactions = [...transactions, ...transactionData.data];
					transactions = transactions.filter(
						(obj) => !(obj.leafType === 'MESSAGE' && obj.amount === '0')
					);

					startAfter = transactionData.pagination.nextStartAfterCursor;
					if (!startAfter) {
						hasNext = false;
					}
				} else {
					// Malformed response - exit the loop to prevent infinite loop
					Logger.error({
						location: 'TransactionService.getPendingTransactions',
						error: 'Malformed API response - missing data field'
					});
					hasNext = false;
				}
			}
		} catch (error: any) {
			Logger.error({
				location: 'TransactionService.getPendingTransactions',
				error: error.message
			});
		}

		Logger.info({
			location: 'TransactionService.getPendingTransactions',
			length: transactions.length
		});
		return transactions;
	}

	async getProof(
		sourceNetwork: number,
		depositCount: number,
		leafIndex: number
	): Promise<ClaimProof | null> {
		let proof: ClaimProof | null = null;
		try {
			const response = await fetch(
				`${this.bridgeHubAPIUrl}/claim-proof?sourceNetworkId=${sourceNetwork}&leafIndex=${leafIndex}&depositCount=${depositCount}`
			);
			const proofData = (await response.json()) as ClaimProofResponse;
			if (proofData?.data?.proof_local_exit_root && proofData?.data?.proof_rollup_exit_root) {
				proof = proofData.data;
			}
		} catch (error: any) {
			Logger.error({
				location: 'TransactionService.getProof',
				error: error.message,
				data: {
					sourceNetwork,
					depositCount,
					endpoint: `/claim-proof?sourceNetworkId=${sourceNetwork}&leafIndex=${leafIndex}&depositCount=${depositCount}`
				}
			});
		}
		return proof;
	}

	computeGlobalIndex(indexLocal: number, sourceNetworkId: number): bigint {
		if (BigInt(sourceNetworkId) === BigInt(0)) {
			return BigInt(indexLocal) + _GLOBAL_INDEX_MAINNET_FLAG;
		} else {
			return BigInt(indexLocal) + BigInt(sourceNetworkId - 1) * BigInt(2 ** 32);
		}
	}
}
