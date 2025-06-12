import type { TransactionStatus } from "../enums/transaction_status";
import type { IBridgeAPIResult } from "./bridge_api_result";

/**
 * Interface for the Aggkit Bridge Tx element
 */
export interface IBridgeTx {
    metadata: string;
    calldata: string;
    bridge_hash: string;
    block_num: number; // BN
    block_pos: number;
    block_timestamp: number;
    leaf_type: number;
    origin_network: number; // origin token network
    origin_address: string; // origin token address
    destination_network: number;
    destination_address: string;
    amount: number; // BN
    deposit_count: number; // BN
    tx_hash: string;
    from_address: string; // user address
}

/**
 * Interface for the Aggkit Bridge API bridge_getBridges method's result
 */
export interface IBridgesBridgeAPIResult extends IBridgeAPIResult {
    bridges: IBridgeTx[];
}

/**
 * Interface for the Hub API's Bridge Transaction entitiy
 */
export interface IHubBridgeTransaction {
    transactionHash: string;
    blockNumber: number;
    transactionIndex: number;
    timestamp: number;
    leafType: "ASSET" | "MESSAGE";
    originTokenNetwork: number;
    originTokenAddress: string;
    sourceNetwork: number;
    destinationNetwork: number;
    receiverAddress: string;
    fromAddress: string;
    amount: number;
    depositCount: number;
    bridgeHash: string;
    status: TransactionStatus;
}
