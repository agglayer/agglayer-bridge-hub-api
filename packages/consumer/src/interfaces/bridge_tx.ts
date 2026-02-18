import type { IBridgeAPIResult } from "./bridge_api_result";

// Re-export shared types from @agglayer/bridge-hub-types
export type {
	TransactionStatus,
	IHubBridgeTransaction,
	IHubBridgedStatusTransactions,
	IHubLeafIncludedStatusTransactions,
} from "@agglayer/bridge-hub-types";

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
	amount: string; // BN
	deposit_count: number; // BN
	tx_hash: string;
	from_address: string; // user address
	txn_sender: string; // relayer address
}

/**
 * Interface for the Aggkit Bridge API bridge_getBridges method's result
 */
export interface IBridgesBridgeAPIResult extends IBridgeAPIResult {
	bridges: IBridgeTx[];
}
