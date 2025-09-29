import type { DatabaseClient } from "@polygonlabs/servercore-firestore";
import { TransactionStatus } from "../enums/transaction_status";
import type {
	IHubBridgedStatusTransactions,
	IHubBridgeTransaction,
	IHubLeafIncludedStatusTransactions,
} from "../interfaces/bridge_tx";
import type { IHubClaimTransaction } from "../interfaces/claim_tx";
import { CryptoHasher } from "bun";

export default class TransactionsService {
	constructor(
		private readonly database: DatabaseClient,
		private readonly collectionId: string = "bridge_hub_api_transactions"
	) {}

	private generateDocId(depositCount: number, sourceNetwork: number): string {
		const hasher = new CryptoHasher("sha256");
		hasher.update(`${depositCount}:${sourceNetwork}`);
		return hasher.digest("hex").slice(0, 32);
	}

	public async saveBridges(
		bridgetransactions: IHubBridgeTransaction[]
	): Promise<void> {
		const docIds: string[] = [];
		for (const tx of bridgetransactions) {
			const docId = this.generateDocId(tx.depositCount, tx.sourceNetwork);
			docIds.push(docId);
		}
		this.database.conditionalUpdateDocuments({
			collectionPaths: this.collectionId,
			docDatas: bridgetransactions,
			docIds,
			conditions: [
				{
					field: "status",
					operator: "==",
					value: TransactionStatus.BRIDGED,
				},
			],
			conditionModifications: [
				{
					field: "status",
					value: TransactionStatus.BRIDGED,
					defaultValue: TransactionStatus.BRIDGED,
				},
			],
		});
	}

	public async saveClaims(
		claimTransactions: IHubClaimTransaction[]
	): Promise<void> {
		const docIds: string[] = [];
		for (const tx of claimTransactions) {
			const docId = this.generateDocId(tx.depositCount, tx.sourceNetwork);
			docIds.push(docId);
		}
		this.database.updateDocuments({
			collectionPaths: this.collectionId,
			docDatas: claimTransactions,
			docIds,
		});
	}

	public async updateLeafIndex(
		depositCount: number,
		sourceNetwork: number,
		leafIndex: number
	): Promise<void> {
		const docId = this.generateDocId(depositCount, sourceNetwork);
		this.database.conditionalUpdateDocuments({
			collectionPaths: this.collectionId,
			docDatas: [{ leafIndex, lastUpdatedAt: Date.now() }],
			docIds: [docId],
			conditions: [
				{
					field: "status",
					operator: "==",
					value: TransactionStatus.BRIDGED,
				},
			],
			conditionModifications: [
				{
					field: "status",
					value: TransactionStatus.LEAF_INCLUDED,
					defaultValue: TransactionStatus.LEAF_INCLUDED,
				},
			],
		});
	}

	public async updateTransactionToReadyToClaim(
		depositCount: number,
		sourceNetwork: number
	): Promise<void> {
		const docId = this.generateDocId(depositCount, sourceNetwork);
		this.database.conditionalUpdateDocuments({
			collectionPaths: this.collectionId,
			docDatas: [{ lastUpdatedAt: Date.now() }],
			docIds: [docId],
			conditions: [
				{
					field: "status",
					operator: "==",
					value: TransactionStatus.LEAF_INCLUDED,
				},
			],
			conditionModifications: [
				{
					field: "status",
					value: TransactionStatus.READY_TO_CLAIM,
					defaultValue: TransactionStatus.READY_TO_CLAIM,
				},
			],
		});
	}

	public async getBridgedTransactions(
		sourceNetwork: number,
		afterId?: string
	): Promise<IHubBridgedStatusTransactions[]> {
		return await this.database
			.getDocuments({
				collectionPath: this.collectionId,
				filter: [
					{
						field: "sourceNetwork",
						operator: "==",
						value: sourceNetwork,
					},
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.BRIDGED,
					},
				],
				limit: 10,
				order: [{ field: "hubUID", order: "asc" }],
				startAfterCursor: afterId,
				selectFields: ["sourceNetwork", "depositCount", "hubUID"],
			})
			.then((res) => res.documents as IHubBridgedStatusTransactions[]);
	}

	public async getLatestBridgeTransactions(
		sourceNetwork: number
	): Promise<IHubBridgedStatusTransactions[]> {
		return await this.database
			.getDocuments({
				collectionPath: this.collectionId,
				filter: [
					{
						field: "sourceNetwork",
						operator: "==",
						value: sourceNetwork,
					},
				],
				limit: 1,
				order: [{ field: "hubUID", order: "desc" }],
				selectFields: [
					"sourceNetwork",
					"depositCount",
					"hubUID",
					"timestamp",
				],
			})
			.then((res) => res.documents as IHubBridgedStatusTransactions[]);
	}

	public async getClaim(
		txHash: string
	): Promise<IHubBridgedStatusTransactions[]> {
		return await this.database
			.getDocuments({
				collectionPath: this.collectionId,
				filter: [
					{
						field: "claimTransactionHash",
						operator: "==",
						value: txHash,
					},
				],
				limit: 1,
				selectFields: ["sourceNetwork", "depositCount", "hubUID"],
			})
			.then((res) => res.documents as IHubBridgedStatusTransactions[]);
	}

	public async getLeafIncludedTransactions(
		destinationNetwork: number,
		afterId?: string
	): Promise<IHubLeafIncludedStatusTransactions[]> {
		return await this.database
			.getDocuments({
				collectionPath: this.collectionId,
				filter: [
					{
						field: "destinationNetwork",
						operator: "==",
						value: destinationNetwork,
					},
					{
						field: "status",
						operator: "==",
						value: TransactionStatus.LEAF_INCLUDED,
					},
				],
				limit: 10,
				order: [{ field: "hubUID", order: "asc" }],
				startAfterCursor: afterId,
				selectFields: [
					"sourceNetwork",
					"depositCount",
					"leafIndex",
					"hubUID",
				],
			})
			.then(
				(res) => res.documents as IHubLeafIncludedStatusTransactions[]
			);
	}
}
