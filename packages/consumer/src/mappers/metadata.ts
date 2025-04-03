import type { ILastIndexedTransaction } from "bridge-hub-commons/interfaces/metadata";
import type { IHubMetadata } from "bridge-hub-commons/interfaces/metadata";

export default class MetadataMapper {
    constructor() {}

    public mapLastIndexedBridgeTx(data: ILastIndexedTransaction): IHubMetadata {
        const formattedMetadata: IHubMetadata = {
            lastIndexedBridgeTxHash: data.transactionHash,
            lastIndexedBridgeBlockNumber: data.blockNumber,
        };

        return formattedMetadata;
    }

    public mapLastIndexedClaimTx(data: ILastIndexedTransaction): IHubMetadata {
        const formattedMetadata: IHubMetadata = {
            lastIndexedClaimTxHash: data.transactionHash,
            lastIndexedClaimBlockNumber: data.blockNumber,
        };

        return formattedMetadata;
    }

    public mapLastIndexedMappingTx(
        data: ILastIndexedTransaction
    ): IHubMetadata {
        const formattedMetadata: IHubMetadata = {
            lastIndexedMappingTxHash: data.transactionHash,
            lastIndexedMappingBlockNumber: data.blockNumber,
        };

        return formattedMetadata;
    }
}
