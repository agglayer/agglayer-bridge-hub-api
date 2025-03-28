import type { IBridgeAPIResult } from "./bridge_api_result";

/**
 * Interface for the Aggkit Claim Tx element
 */
export interface IClaimTx {
    block_num: number;
    block_timestamp: number; // BN
    tx_hash: string;
    global_index: number; // BN
    origin_address: string;
    origin_network: number; // origin token network
    destination_address: string;
    destination_network: number;
    amount: number; // BN
    from_address: string;
}

/**
 * Interface for the Aggkit Bridge API bridge_getClaims method's result
 */
export interface IClaimsBridgeAPIResult extends IBridgeAPIResult {
    claims: IClaimTx[];
}

/**
 * Interface for the Hub API's Claim Transaction entitiy
 */
export interface IHubClaimTransaction {
    claimTransactionHash: string;
    claimBlockNumber: number;
    claimTransactionIndex: number;
    claimTimestamp: number;
    globalIndex: string;
    sourceNetwork: number;
    depositCount: number;
}
