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
        const formattedMetadata: IHubMetadata = {
            lastIndexedBridgeDepositCount: data.deposit_count,
        };

        return formattedMetadata;
    }

    public mapLastIndexedClaimTx(
        data: ILastIndexedClaimTransaction
    ): IHubMetadata {
        const formattedMetadata: IHubMetadata = {
            lastIndexedClaimBlockNumber: data.block_number,
        };

        return formattedMetadata;
    }

    public mapLastIndexedMappingTx(
        data: ILastIndexedMappingTransaction
    ): IHubMetadata {
        const formattedMetadata: IHubMetadata = {
            lastIndexedMappingBlockNumber: data.block_number,
        };

        return formattedMetadata;
    }
}
