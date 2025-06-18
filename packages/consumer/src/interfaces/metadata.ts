export interface IHubMetadata {
    lastIndexedBridgeDepositCount?: number;
    lastIndexedClaimBlockNumber?: number;
    lastIndexedMappingBlockNumber?: number;
}

export interface ILastIndexedBridgeTransaction {
    deposit_count: number;
}

export interface ILastIndexedClaimTransaction {
    block_number: number;
}

export interface ILastIndexedMappingTransaction {
    block_number: number;
}
