export interface IHubMetadata {
    lastIndexedBridgeTxHash?: string;
    lastIndexedBridgeBlockNumber?: number;
    lastIndexedClaimTxHash?: string;
    lastIndexedClaimBlockNumber?: number;
    lastIndexedMappingTxHash?: string;
    lastIndexedMappingBlockNumber?: number;
}

export interface ILastIndexedTransaction {
    transactionHash: string;
    blockNumber: number;
}
