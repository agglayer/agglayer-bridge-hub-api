import type { IBridgeAPIResult } from "./bridge_api_result";

/**
 * Interface for the Aggkit Mapping Tx element
 */
export interface IMappingTx {
    metadata: string;
    calldata: string;
    block_num: number; // BN
    block_pos: number;
    block_timestamp: number; // BN
    tx_hash: string;
    origin_network: number;
    origin_token_address: string;
    wrapped_token_address: string;
}

/**
 * Interface for the Aggkit Bridge API bridge_getMappings method's result
 */
export interface IMappingsBridgeAPIResult extends IBridgeAPIResult {
    tokenMappings: IMappingTx[];
}

/**
 * Interface for the Hub API's Token Mappings entitiy
 */
export interface IHubTokenMappings {
    blockNumber: number;
    transactionIndex: number;
    timestamp: number;
    transactionHash: string;
    originTokenNetwork: number;
    originTokenAddress: string;
    wrappedTokenNetwork: number;
    wrappedTokenAddress: string;
    lastUpdatedAt: number;
}
