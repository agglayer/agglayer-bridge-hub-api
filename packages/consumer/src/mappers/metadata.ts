import type {
	IHubMetadata,
	ILastIndexedBridgeTransaction,
	ILastIndexedClaimTransaction,
	ILastIndexedMappingTransaction,
} from "../interfaces/metadata";

export default class MetadataMapper {
	constructor() {}

	public mapLastIndexedBridgeTx(
		data: ILastIndexedBridgeTransaction
	): IHubMetadata {
		const formattedMetadata: IHubMetadata = {};

		if (
			data.deposit_count !== undefined &&
			data.deposit_count !== null &&
			!Number.isNaN(data.deposit_count)
		) {
			formattedMetadata.lastIndexedBridgeDepositCount =
				data.deposit_count;
		}

		return formattedMetadata;
	}

	public mapLastIndexedClaimTx(
		data: ILastIndexedClaimTransaction
	): IHubMetadata {
		const formattedMetadata: IHubMetadata = {};

		if (
			data.block_num !== undefined &&
			data.block_num !== null &&
			!Number.isNaN(data.block_num)
		) {
			formattedMetadata.lastIndexedClaimBlockNumber = data.block_num;
		}

		return formattedMetadata;
	}

	public mapLastIndexedMappingTx(
		data: ILastIndexedMappingTransaction
	): IHubMetadata {
		const formattedMetadata: IHubMetadata = {};

		if (
			data.block_num !== undefined &&
			data.block_num !== null &&
			!Number.isNaN(data.block_num)
		) {
			formattedMetadata.lastIndexedMappingBlockNumber = data.block_num;
		}

		return formattedMetadata;
	}
}
